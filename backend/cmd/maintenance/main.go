// Maintenance is an offline recovery utility; it exposes no HTTP endpoint.
package main

import (
	"bytes"
	"casadelrey/backend/operations"
	"casadelrey/backend/storage"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"
)

type object struct {
	Bucket string `json:"bucket"`
	Key    string `json:"key"`
	Size   int64  `json:"size"`
	ETag   string `json:"etag"`
	SHA256 string `json:"sha256,omitempty"`
	Blob   string `json:"blob,omitempty"`
}
type mapping struct {
	object
	Reference  string `json:"reference"`
	PrivateKey string `json:"private_key"`
	PublicURL  string `json:"public_url"`
}
type client struct {
	s3                         *s3.Client
	key                        []byte
	public, private, publicURL string
}

func setup() (*client, error) {
	key, err := os.ReadFile(os.Getenv("BACKUP_KEY_FILE"))
	if err != nil || len(key) != 32 {
		return nil, errors.New("backup key unavailable")
	}
	c := s3.NewFromConfig(aws.Config{Region: "auto", HTTPClient: &http.Client{Timeout: 90 * time.Second}, RetryMaxAttempts: 2, Credentials: credentials.NewStaticCredentialsProvider(os.Getenv("CF_R2_ACCESS_KEY"), os.Getenv("CF_R2_SECRET_KEY"), "")}, func(o *s3.Options) {
		o.BaseEndpoint = aws.String("https://" + os.Getenv("CF_R2_ACCOUNT_ID") + ".r2.cloudflarestorage.com")
		o.UsePathStyle = true
	})
	result := &client{c, key, os.Getenv("CF_R2_BUCKET"), os.Getenv("CF_R2_PRIVATE_BUCKET"), strings.TrimRight(os.Getenv("CF_R2_PUBLIC_URL"), "/")}
	if result.public == "" || result.private == "" || result.public == result.private {
		return nil, errors.New("separate public and private buckets required")
	}
	return result, nil
}
func (c *client) list(ctx context.Context, bucket, prefix string) ([]object, error) {
	var rows []object
	pages := s3.NewListObjectsV2Paginator(c.s3, &s3.ListObjectsV2Input{Bucket: aws.String(bucket), Prefix: aws.String(prefix)})
	for pages.HasMorePages() {
		page, err := pages.NextPage(ctx)
		if err != nil {
			return nil, errors.New("storage inventory failed")
		}
		for _, o := range page.Contents {
			rows = append(rows, object{Bucket: bucket, Key: aws.ToString(o.Key), Size: aws.ToInt64(o.Size), ETag: aws.ToString(o.ETag)})
		}
	}
	return rows, nil
}
func (c *client) read(ctx context.Context, bucket, key string) ([]byte, error) {
	var last error
	for attempt := 0; attempt < 3; attempt++ {
		o, err := c.s3.GetObject(ctx, &s3.GetObjectInput{Bucket: aws.String(bucket), Key: aws.String(key)})
		if err != nil {
			last = errors.New("storage object request failed")
			continue
		}
		data, readErr := io.ReadAll(io.LimitReader(o.Body, (128<<20)+1))
		o.Body.Close()
		if len(data) > 128<<20 {
			return nil, errors.New("storage object exceeds 128 MB recovery limit")
		}
		if readErr == nil {
			return data, nil
		}
		last = fmt.Errorf("storage stream interrupted (%T)", readErr)
	}
	return nil, last
}

func (c *client) put(ctx context.Context, key string, data []byte, contentType string) error {
	_, err := c.s3.PutObject(ctx, &s3.PutObjectInput{Bucket: aws.String(c.private), Key: aws.String(key), Body: bytes.NewReader(data), ContentLength: aws.Int64(int64(len(data))), ContentType: aws.String(contentType), CacheControl: aws.String("private, no-store")})
	if err != nil {
		return errors.New("private storage write failed")
	}
	return nil
}
func (c *client) manifest(path string, v any) error {
	data, err := json.Marshal(v)
	if err != nil {
		return err
	}
	sealed, err := operations.Seal(c.key, data)
	if err != nil {
		return err
	}
	return operations.SavePrivate(path, sealed)
}
func (c *client) backup(ctx context.Context, dir string) error {
	if err := os.MkdirAll(filepath.Join(dir, "objects"), 0700); err != nil {
		return err
	}
	var rows []object
	for _, bucket := range []string{c.public, c.private} {
		all, err := c.list(ctx, bucket, "")
		if err != nil {
			return err
		}
		for _, row := range all {
			if !strings.HasPrefix(row.Key, "backups/") {
				rows = append(rows, row)
			}
		}
	}
	previous := map[string]object{}
	manifests, _ := filepath.Glob(filepath.Join(dir, "storage-*.json.aes"))
	sort.Strings(manifests)
	if len(manifests) > 0 {
		data, err := os.ReadFile(manifests[len(manifests)-1])
		if err != nil {
			return err
		}
		plain, err := operations.Open(c.key, data)
		if err != nil {
			return errors.New("previous storage manifest authentication failed")
		}
		var decoded struct {
			Objects []object `json:"objects"`
		}
		if err = json.Unmarshal(plain, &decoded); err != nil {
			return err
		}
		for _, row := range decoded.Objects {
			previous[row.Bucket+"\x00"+row.Key] = row
		}
	}
	var total int64
	for _, row := range rows {
		total += row.Size
	}
	fmt.Printf("Storage inventory: %d objects, %d bytes\n", len(rows), total)
	tasks := make(chan int)
	var wg sync.WaitGroup
	var lock sync.Mutex
	var failure error
	var completed int
	for w := 0; w < 4; w++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for i := range tasks {
				lock.Lock()
				failed := failure != nil
				lock.Unlock()
				if failed {
					continue
				}
				row := rows[i]
				var data []byte
				var err error
				if old, ok := previous[row.Bucket+"\x00"+row.Key]; ok && old.ETag == row.ETag && old.Size == row.Size {
					sealed, readErr := os.ReadFile(filepath.Join(dir, "objects", old.SHA256+".aes"))
					if readErr == nil {
						data, err = operations.Open(c.key, sealed)
						if err != nil || operations.Digest(data) != old.SHA256 {
							err = errors.New("incremental recovery object failed integrity check")
						}
					} else {
						data, err = c.read(ctx, row.Bucket, row.Key)
					}
				} else {
					data, err = c.read(ctx, row.Bucket, row.Key)
				}
				if err == nil && int64(len(data)) != row.Size {
					err = errors.New("storage changed during snapshot; retry required")
				}
				if err == nil {
					row.SHA256 = operations.Digest(data)
					row.Blob = "backups/objects/" + row.SHA256 + ".aes"
					local := filepath.Join(dir, "objects", row.SHA256+".aes")
					sealed, readErr := os.ReadFile(local)
					if readErr == nil {
						plain, openErr := operations.Open(c.key, sealed)
						if openErr != nil || operations.Digest(plain) != row.SHA256 {
							err = errors.New("local backup integrity failed")
						}
					}
					if os.IsNotExist(readErr) {
						sealed, err = operations.Seal(c.key, data)
						if err == nil {
							err = operations.SavePrivate(local, sealed)
							if os.IsExist(err) {
								sealed, err = os.ReadFile(local)
								if err == nil {
									recovered, decryptErr := operations.Open(c.key, sealed)
									if decryptErr != nil || operations.Digest(recovered) != row.SHA256 {
										err = errors.New("duplicate object integrity failure")
									}
								}
							}
						}
					} else if readErr != nil {
						err = readErr
					}
					if err == nil {
						head, headErr := c.s3.HeadObject(ctx, &s3.HeadObjectInput{Bucket: aws.String(c.private), Key: aws.String(row.Blob)})
						if headErr != nil || aws.ToInt64(head.ContentLength) != int64(len(sealed)) {
							err = c.put(ctx, row.Blob, sealed, "application/octet-stream")
						}
					}
				}
				lock.Lock()
				if err != nil {
					failure = err
				} else {
					rows[i] = row
					completed++
					if completed%50 == 0 {
						fmt.Printf("Storage protected: %d/%d\n", completed, len(rows))
					}
				}
				lock.Unlock()
			}
		}()
	}
	for i := range rows {
		tasks <- i
	}
	close(tasks)
	wg.Wait()
	if failure != nil {
		return failure
	}
	name := "storage-" + time.Now().UTC().Format("20060102T150405.000000000Z") + ".json.aes"
	local := filepath.Join(dir, name)
	if err := c.manifest(local, map[string]any{"version": 1, "created_at": time.Now().UTC(), "objects": rows}); err != nil {
		return err
	}
	sealed, err := os.ReadFile(local)
	if err != nil {
		return err
	}
	if err = c.put(ctx, "backups/manifests/"+name, sealed, "application/octet-stream"); err != nil {
		return err
	}
	remote, err := c.read(ctx, c.private, "backups/manifests/"+name)
	if err != nil || !bytes.Equal(remote, sealed) {
		return errors.New("remote backup manifest verification failed")
	}
	fmt.Printf("Storage backup complete: %d objects; encrypted manifest %s\n", len(rows), name)
	return nil
}
func (c *client) stage(ctx context.Context, path string) error {
	rows, err := c.list(ctx, c.public, "comprobantes/")
	if err != nil {
		return err
	}
	plan := []mapping{}
	for _, row := range rows {
		name := uuid.NewSHA1(uuid.NameSpaceOID, []byte(row.Bucket+"/"+row.Key)).String() + strings.ToLower(filepath.Ext(row.Key))
		ref := storage.ReceiptReference(name)
		key, ok := storage.ReceiptKey(ref)
		if !ok {
			return errors.New("unsupported legacy receipt format; manual classification required")
		}
		data, err := c.read(ctx, row.Bucket, row.Key)
		if err != nil {
			return err
		}
		row.SHA256 = operations.Digest(data)
		if err = c.put(ctx, key, data, storage.DetectContentType(row.Key, data)); err != nil {
			return err
		}
		copied, err := c.read(ctx, c.private, key)
		if err != nil || operations.Digest(copied) != row.SHA256 {
			return errors.New("private receipt copy verification failed")
		}
		plan = append(plan, mapping{row, ref, key, c.publicURL + "/" + row.Key})
	}
	if err = c.manifest(path, plan); err != nil {
		return err
	}
	fmt.Printf("Legacy receipts copied and verified privately: %d; public originals retained\n", len(plan))
	return nil
}
func (c *client) retire(ctx context.Context, path string) error {
	sealed, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	plain, err := operations.Open(c.key, sealed)
	if err != nil {
		return err
	}
	var plan []mapping
	if err = json.Unmarshal(plain, &plan); err != nil {
		return err
	}
	for _, row := range plan {
		if row.Bucket != c.public || !strings.HasPrefix(row.Key, "comprobantes/") || row.PublicURL != c.publicURL+"/"+row.Key {
			return errors.New("invalid retirement plan")
		}
		key, ok := storage.ReceiptKey(row.Reference)
		if !ok || key != row.PrivateKey {
			return errors.New("invalid private reference")
		}
		backup, err := os.ReadFile(filepath.Join(os.Getenv("BACKUP_HOME"), "storage", "objects", row.SHA256+".aes"))
		if err != nil {
			return errors.New("encrypted recovery copy required")
		}
		recovered, err := operations.Open(c.key, backup)
		if err != nil || operations.Digest(recovered) != row.SHA256 {
			return errors.New("recovery copy failed integrity check")
		}
		copied, err := c.read(ctx, c.private, row.PrivateKey)
		if err != nil || operations.Digest(copied) != row.SHA256 {
			return errors.New("private receipt copy missing")
		}
		head, err := c.s3.HeadObject(ctx, &s3.HeadObjectInput{Bucket: aws.String(c.public), Key: aws.String(row.Key)})
		if err == nil {
			if aws.ToString(head.ETag) != row.ETag {
				return errors.New("public object changed; stopped")
			}
			_, err = c.s3.DeleteObject(ctx, &s3.DeleteObjectInput{Bucket: aws.String(c.public), Key: aws.String(row.Key)})
			if err != nil {
				return errors.New("public original retirement failed")
			}
		}
		req, err := http.NewRequestWithContext(ctx, http.MethodHead, row.PublicURL, nil)
		if err != nil {
			return err
		}
		response, err := http.DefaultClient.Do(req)
		if err != nil {
			return errors.New("public retirement check failed")
		}
		response.Body.Close()
		if response.StatusCode != 404 && response.StatusCode != 403 {
			return fmt.Errorf("public original still responds with %d", response.StatusCode)
		}
	}
	fmt.Printf("Public originals retired; private and encrypted recovery copies verified: %d\n", len(plan))
	return nil
}
func run() error {
	if len(os.Args) < 2 {
		return errors.New("use seal, open, storage-backup, legacy-stage or legacy-retire")
	}
	if os.Args[1] == "seal" || os.Args[1] == "open" {
		if len(os.Args) != 4 {
			return errors.New("input and output paths required")
		}
		key, err := os.ReadFile(os.Getenv("BACKUP_KEY_FILE"))
		if err != nil {
			return err
		}
		input, err := os.ReadFile(os.Args[2])
		if err != nil {
			return err
		}
		var output []byte
		if os.Args[1] == "seal" {
			output, err = operations.Seal(key, input)
		} else {
			output, err = operations.Open(key, input)
		}
		if err != nil {
			return err
		}
		return operations.SavePrivate(os.Args[3], output)
	}
	c, err := setup()
	if err != nil {
		return err
	}
	ctx, cancel := context.WithTimeout(context.Background(), 90*time.Minute)
	defer cancel()
	if len(os.Args) != 3 {
		return errors.New("protected directory or encrypted plan path required")
	}
	switch os.Args[1] {
	case "upload-backup":
		data, err := os.ReadFile(os.Args[2])
		if err != nil {
			return err
		}
		if _, err = operations.Open(c.key, data); err != nil {
			return errors.New("only authenticated encrypted snapshots may be uploaded")
		}
		name := "backups/database/" + filepath.Base(os.Args[2])
		if err = c.put(ctx, name, data, "application/octet-stream"); err != nil {
			return err
		}
		remote, err := c.read(ctx, c.private, name)
		if err != nil || !bytes.Equal(remote, data) {
			return errors.New("remote database snapshot verification failed")
		}
		fmt.Println("Encrypted remote database snapshot verified")
		return nil
	case "storage-backup":
		return c.backup(ctx, os.Args[2])
	case "legacy-stage":
		return c.stage(ctx, os.Args[2])
	case "legacy-retire":
		return c.retire(ctx, os.Args[2])
	}
	return errors.New("unknown command")
}
func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, "Maintenance stopped:", err)
		os.Exit(1)
	}
}
