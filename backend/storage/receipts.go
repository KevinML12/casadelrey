package storage

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// ReceiptStore deliberately exposes no public URL or presigned download.
// Every read must pass through the authenticated receipt handler.
type ReceiptStore interface {
	UploadReceipt(context.Context, string, io.Reader, int64, string) (string, error)
	OpenReceipt(context.Context, string) (io.ReadCloser, string, error)
}

var receiptName = regexp.MustCompile(`^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.(png|jpg|jpeg|webp|gif|pdf)$`)

const receiptPrefix = "receipt-private:"

func ReceiptReference(filename string) string { return receiptPrefix + filename }

// ReceiptKey accepts only opaque references created by our receipt upload.
// URLs, paths, traversal, query strings and user-chosen bucket names are rejected.
func ReceiptKey(reference string) (string, bool) {
	if !strings.HasPrefix(reference, receiptPrefix) {
		return "", false
	}
	name := strings.TrimPrefix(reference, receiptPrefix)
	if !receiptName.MatchString(name) {
		return "", false
	}
	return "comprobantes/" + name, true
}

func (s *r2Store) receiptBucket() (string, error) {
	if s.privateBucket == "" || s.privateBucket == s.bucket {
		return "", fmt.Errorf("configure CF_R2_PRIVATE_BUCKET as a separate bucket with public access disabled")
	}
	return s.privateBucket, nil
}

func (s *r2Store) UploadReceipt(ctx context.Context, filename string, data io.Reader, size int64, contentType string) (string, error) {
	ref := ReceiptReference(filename)
	key, ok := ReceiptKey(ref)
	if !ok {
		return "", fmt.Errorf("invalid receipt filename")
	}
	bucket, err := s.receiptBucket()
	if err != nil {
		return "", err
	}
	body, err := io.ReadAll(io.LimitReader(data, (10<<20)+1))
	if err != nil || len(body) > 10<<20 {
		return "", fmt.Errorf("invalid receipt data")
	}
	_, err = s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket: aws.String(bucket), Key: aws.String(key), Body: bytes.NewReader(body),
		ContentType: aws.String(contentType), ContentLength: aws.Int64(int64(len(body))),
		CacheControl: aws.String("private, no-store"),
	})
	if err != nil {
		return "", err
	}
	return ref, nil
}

func (s *r2Store) OpenReceipt(ctx context.Context, reference string) (io.ReadCloser, string, error) {
	key, ok := ReceiptKey(reference)
	if !ok {
		return nil, "", fmt.Errorf("invalid receipt reference")
	}
	bucket, err := s.receiptBucket()
	if err != nil {
		return nil, "", err
	}
	obj, err := s.client.GetObject(ctx, &s3.GetObjectInput{Bucket: aws.String(bucket), Key: aws.String(key)})
	if err != nil {
		return nil, "", err
	}
	return obj.Body, DetectContentType(key, nil), nil
}

// The sibling directory is outside /uploads. OpenRoot confines all filesystem
// operations, including symlink resolution, to that private directory.
func (s *localStore) UploadReceipt(_ context.Context, filename string, data io.Reader, _ int64, _ string) (string, error) {
	ref := ReceiptReference(filename)
	if _, ok := ReceiptKey(ref); !ok {
		return "", fmt.Errorf("invalid receipt filename")
	}
	if err := os.MkdirAll(s.dir+"-private", 0700); err != nil {
		return "", err
	}
	root, err := os.OpenRoot(s.dir + "-private")
	if err != nil {
		return "", err
	}
	defer root.Close()
	f, err := root.OpenFile(filename, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0600)
	if err != nil {
		return "", err
	}
	n, copyErr := io.Copy(f, io.LimitReader(data, (10<<20)+1))
	closeErr := f.Close()
	if copyErr != nil || closeErr != nil || n == 0 || n > 10<<20 {
		root.Remove(filename)
		return "", fmt.Errorf("could not write private receipt")
	}
	return ref, nil
}

func (s *localStore) OpenReceipt(_ context.Context, reference string) (io.ReadCloser, string, error) {
	key, ok := ReceiptKey(reference)
	if !ok {
		return nil, "", fmt.Errorf("invalid receipt reference")
	}
	root, err := os.OpenRoot(s.dir + "-private")
	if err != nil {
		return nil, "", err
	}
	defer root.Close()
	f, err := root.Open(filepath.Base(key))
	if err != nil {
		return nil, "", err
	}
	return f, DetectContentType(key, nil), nil
}
