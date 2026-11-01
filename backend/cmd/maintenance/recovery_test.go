package main

import (
	"context"
	"encoding/json"
	"encoding/xml"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync/atomic"
	"testing"

	"casadelrey/backend/operations"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

func recoveryFixture(t *testing.T, change func(map[string][]byte, []byte)) (*client, *atomic.Int32) {
	t.Helper()
	key := []byte("01234567890123456789012345678901")
	seal := func(value []byte) []byte {
		data, err := operations.Seal(key, value)
		if err != nil {
			t.Fatal(err)
		}
		return data
	}
	encode := func(value any) []byte {
		data, err := json.Marshal(value)
		if err != nil {
			t.Fatal(err)
		}
		return seal(data)
	}
	file := []byte("original photograph bytes")
	digest := operations.Digest(file)
	blob := "backups/objects/" + digest + ".aes"
	dump := []byte("controlled database dump")
	files := map[string][]byte{
		"backups/database/active-20261101T090000Z.dump.aes":     seal(dump),
		"backups/database/active-20261101T090000Z.manifest.aes": encode(map[string]string{"source": "active", "schema": "cdr_render_qa", "snapshot": "active-20261101T090000Z.dump.aes", "sha256": operations.Digest(dump)}),
		blob: seal(file),
		"backups/manifests/storage-20261101T090001.000000000Z.json.aes": encode(map[string]any{"version": 1, "objects": []object{{Key: "one", Size: int64(len(file)), SHA256: digest, Blob: blob}, {Key: "two", Size: int64(len(file)), SHA256: digest, Blob: blob}}}),
	}
	if change != nil {
		change(files, key)
	}
	var downloads atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Query().Get("list-type") == "2" {
			type entry struct {
				Key  string
				Size int
			}
			var result struct {
				XMLName     xml.Name `xml:"ListBucketResult"`
				IsTruncated bool
				Contents    []entry
			}
			var names []string
			for name := range files {
				if strings.HasPrefix(name, r.URL.Query().Get("prefix")) {
					names = append(names, name)
				}
			}
			sort.Strings(names)
			for _, name := range names {
				result.Contents = append(result.Contents, entry{name, len(files[name])})
			}
			w.Header().Set("Content-Type", "application/xml")
			xml.NewEncoder(w).Encode(result)
			return
		}
		name := strings.TrimPrefix(r.URL.Path, "/private/")
		if value, ok := files[name]; ok {
			if strings.HasPrefix(name, "backups/objects/") {
				downloads.Add(1)
			}
			w.Write(value)
		} else {
			http.NotFound(w, r)
		}
	}))
	t.Cleanup(server.Close)
	api := s3.NewFromConfig(aws.Config{Region: "auto", Credentials: aws.AnonymousCredentials{}}, func(o *s3.Options) { o.BaseEndpoint = aws.String(server.URL); o.UsePathStyle = true })
	return &client{s3: api, key: key, private: "private"}, &downloads
}

func TestRecoveryDownloadsAuthenticatedBackupsAndDeduplicates(t *testing.T) {
	c, reads := recoveryFixture(t, nil)
	dir := filepath.Join(t.TempDir(), "recovery")
	if err := c.fetchRecovery(context.Background(), dir); err != nil {
		t.Fatal(err)
	}
	if reads.Load() != 1 {
		t.Fatalf("duplicate contents downloaded %d times", reads.Load())
	}
	stat, err := os.Stat(dir)
	if err != nil || stat.Mode().Perm() != 0700 {
		t.Fatal("recovery directory must be private")
	}
	var report struct {
		Objects int `json:"storage_objects_verified"`
	}
	data, _ := os.ReadFile(filepath.Join(dir, "remote-result.json"))
	if json.Unmarshal(data, &report) != nil || report.Objects != 2 {
		t.Fatal("incomplete recovery report")
	}
	for _, name := range []string{"active-20261101T090000Z.dump.aes", "active-20261101T090000Z.manifest.aes"} {
		stat, err := os.Stat(filepath.Join(dir, name))
		if err != nil || stat.Mode().Perm() != 0600 {
			t.Fatal("recovered snapshots must be private")
		}
	}
}

func TestRecoveryRejectsCorruptionAndUnsafeReferences(t *testing.T) {
	for _, scenario := range []string{"corrupt-blob", "wrong-database-hash", "path-escape", "missing-active", "wrong-file-size"} {
		t.Run(scenario, func(t *testing.T) {
			c, _ := recoveryFixture(t, func(files map[string][]byte, key []byte) {
				for name, data := range files {
					if scenario == "corrupt-blob" && strings.HasPrefix(name, "backups/objects/") {
						data[len(data)-1] ^= 1
					}
					if scenario == "missing-active" && strings.HasSuffix(name, ".manifest.aes") {
						delete(files, name)
					}
					if (scenario == "wrong-database-hash" || scenario == "path-escape") && strings.HasSuffix(name, ".manifest.aes") {
						plain, _ := operations.Open(key, data)
						var metadata map[string]string
						json.Unmarshal(plain, &metadata)
						if scenario == "path-escape" {
							metadata["snapshot"] = "../../outside.dump.aes"
						} else {
							metadata["sha256"] = strings.Repeat("0", 64)
						}
						plain, _ = json.Marshal(metadata)
						files[name], _ = operations.Seal(key, plain)
					}
					if scenario == "wrong-file-size" && strings.Contains(name, "backups/manifests/") {
						plain, _ := operations.Open(key, data)
						var m struct {
							Version int      `json:"version"`
							Objects []object `json:"objects"`
						}
						json.Unmarshal(plain, &m)
						for i := range m.Objects {
							m.Objects[i].Size++
						}
						plain, _ = json.Marshal(m)
						files[name], _ = operations.Seal(key, plain)
					}
				}
			})
			dir := filepath.Join(t.TempDir(), "recovery")
			if err := c.fetchRecovery(context.Background(), dir); err == nil {
				t.Fatal("unsafe recovery accepted")
			}
			if _, err := os.Stat(dir); !os.IsNotExist(err) {
				t.Fatal("partial recovery must not remain marked as usable")
			}
		})
	}
}

func TestRecoveryNeverOverwritesAnExistingDestination(t *testing.T) {
	c, _ := recoveryFixture(t, nil)
	dir := t.TempDir()
	marker := filepath.Join(dir, "preserve")
	if err := os.WriteFile(marker, []byte("existing"), 0600); err != nil {
		t.Fatal(err)
	}
	if err := c.fetchRecovery(context.Background(), dir); err == nil {
		t.Fatal("existing destination accepted")
	}
	if data, err := os.ReadFile(marker); err != nil || string(data) != "existing" {
		t.Fatal("existing destination changed")
	}
}
