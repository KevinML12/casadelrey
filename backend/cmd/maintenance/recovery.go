package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"sync"
	"time"

	"casadelrey/backend/operations"
)

var recoveryDigest = regexp.MustCompile(`^[a-f0-9]{64}$`)

func latestRecoveryKey(rows []object, prefix string, pattern *regexp.Regexp) string {
	var keys []string
	for _, row := range rows {
		name := strings.TrimPrefix(row.Key, prefix)
		if strings.HasPrefix(row.Key, prefix) && pattern.MatchString(name) {
			keys = append(keys, row.Key)
		}
	}
	sort.Strings(keys)
	if len(keys) == 0 {
		return ""
	}
	return keys[len(keys)-1]
}

// Recovery reads only encrypted backup objects in the private bucket. It never
// reads live media, changes an object or connects to a production database.
func (c *client) fetchRecovery(ctx context.Context, dir string) (err error) {
	if err = os.Mkdir(dir, 0700); err != nil {
		return errors.New("recovery requires a new private output directory")
	}
	complete := false
	defer func() {
		if !complete {
			os.RemoveAll(dir)
		}
	}()
	var sources []string
	rows, err := c.list(ctx, c.private, "backups/database/")
	if err != nil {
		return err
	}
	for _, source := range []string{"active", "historical"} {
		pattern := regexp.MustCompile(`^` + source + `-[0-9TZ]+\.manifest\.aes$`)
		key := latestRecoveryKey(rows, "backups/database/", pattern)
		if key == "" {
			if source == "active" {
				return errors.New("no active database recovery manifest found")
			}
			continue
		}
		sealed, plain, readErr := c.readRecovery(ctx, key)
		if readErr != nil {
			return readErr
		}
		var metadata struct{ Source, Schema, Snapshot, SHA256 string }
		name := strings.TrimPrefix(key, "backups/database/")
		expected := strings.TrimSuffix(name, ".manifest.aes") + ".dump.aes"
		schema := "cdr_render_qa"
		if source == "historical" {
			schema = "public"
		}
		if json.Unmarshal(plain, &metadata) != nil || metadata.Source != source || metadata.Schema != schema || metadata.Snapshot != expected || !recoveryDigest.MatchString(metadata.SHA256) {
			return errors.New("invalid database recovery manifest")
		}
		dump, decoded, readErr := c.readRecovery(ctx, "backups/database/"+expected)
		if readErr != nil || operations.Digest(decoded) != metadata.SHA256 {
			return errors.New("remote database recovery checksum failed")
		}
		if err = operations.SavePrivate(filepath.Join(dir, name), sealed); err != nil {
			return err
		}
		if err = operations.SavePrivate(filepath.Join(dir, expected), dump); err != nil {
			return err
		}
		sources = append(sources, source)
		fmt.Printf("Remote database recovery verified: %s\n", source)
	}

	rows, err = c.list(ctx, c.private, "backups/manifests/")
	if err != nil {
		return err
	}
	key := latestRecoveryKey(rows, "backups/manifests/", regexp.MustCompile(`^storage-[0-9T.Z]+\.json\.aes$`))
	if key == "" {
		return errors.New("no storage recovery manifest found")
	}
	sealed, plain, err := c.readRecovery(ctx, key)
	if err != nil {
		return err
	}
	var manifest struct {
		Version int      `json:"version"`
		Objects []object `json:"objects"`
	}
	if json.Unmarshal(plain, &manifest) != nil || manifest.Version != 1 || manifest.Objects == nil {
		return errors.New("invalid storage recovery manifest")
	}
	unique := map[string]object{}
	for _, row := range manifest.Objects {
		if !recoveryDigest.MatchString(row.SHA256) || row.Blob != "backups/objects/"+row.SHA256+".aes" || row.Size < 0 || row.Size > 128<<20 {
			return errors.New("invalid recovery object reference")
		}
		if previous, exists := unique[row.SHA256]; exists && previous.Size != row.Size {
			return errors.New("conflicting recovery object sizes")
		}
		unique[row.SHA256] = row
	}
	storage := filepath.Join(dir, "storage")
	if err = os.MkdirAll(filepath.Join(storage, "objects"), 0700); err != nil {
		return err
	}
	tasks := make(chan object)
	var wg sync.WaitGroup
	var lock sync.Mutex
	var failure error
	verified := 0
	for worker := 0; worker < 4; worker++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for row := range tasks {
				lock.Lock()
				failed := failure != nil
				lock.Unlock()
				if failed {
					continue
				}
				data, decoded, readErr := c.readRecovery(ctx, row.Blob)
				if readErr == nil && (int64(len(decoded)) != row.Size || operations.Digest(decoded) != row.SHA256) {
					readErr = errors.New("remote file recovery checksum failed")
				}
				if readErr == nil {
					readErr = operations.SavePrivate(filepath.Join(storage, "objects", row.SHA256+".aes"), data)
				}
				lock.Lock()
				if readErr != nil {
					failure = readErr
				} else {
					verified++
					if verified%50 == 0 {
						fmt.Printf("Remote encrypted files verified: %d/%d\n", verified, len(unique))
					}
				}
				lock.Unlock()
			}
		}()
	}
	for _, row := range unique {
		tasks <- row
	}
	close(tasks)
	wg.Wait()
	if failure != nil {
		return failure
	}
	if err = operations.SavePrivate(filepath.Join(storage, strings.TrimPrefix(key, "backups/manifests/")), sealed); err != nil {
		return err
	}
	report := map[string]any{"database_sources": sources, "storage_objects_verified": len(manifest.Objects), "distinct_encrypted_files_downloaded": verified, "verified_at": time.Now().UTC()}
	encoded, _ := json.Marshal(report)
	if err = operations.SavePrivate(filepath.Join(dir, "remote-result.json"), encoded); err != nil {
		return err
	}
	complete = true
	fmt.Println(string(encoded))
	return nil
}

func (c *client) readRecovery(ctx context.Context, key string) ([]byte, []byte, error) {
	// Reserve a small allowance for the authenticated encryption envelope.
	sealed, err := c.readLimited(ctx, c.private, key, (128<<20)+1024)
	if err != nil {
		return nil, nil, err
	}
	plain, err := operations.Open(c.key, sealed)
	if err != nil {
		return nil, nil, errors.New("remote recovery authentication failed")
	}
	return sealed, plain, nil
}
