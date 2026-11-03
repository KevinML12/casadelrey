package storage

import (
	"bytes"
	"context"
	"fmt"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

// SupportStore shares the existing private bucket, using a distinct namespace.
// Callers must authorize the ticket before every read. No signed/public URLs.
type SupportStore interface {
	UploadSupport(context.Context, string, io.Reader, int64, string) (string, error)
	OpenSupport(context.Context, string) (io.ReadCloser, string, error)
}

const supportPrefix = "support-private:"

var supportName = regexp.MustCompile(`^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.(png|jpg|jpeg)$`)

func SupportReference(filename string) string { return supportPrefix + filename }
func SupportKey(reference string) (string, bool) {
	if !strings.HasPrefix(reference, supportPrefix) {
		return "", false
	}
	name := strings.TrimPrefix(reference, supportPrefix)
	if !supportName.MatchString(name) {
		return "", false
	}
	return "soporte/" + name, true
}
func (s *r2Store) UploadSupport(ctx context.Context, name string, data io.Reader, _ int64, mime string) (string, error) {
	ref := SupportReference(name)
	key, ok := SupportKey(ref)
	if !ok {
		return "", fmt.Errorf("invalid support reference")
	}
	bucket, err := s.receiptBucket()
	if err != nil {
		return "", err
	}
	body, err := io.ReadAll(io.LimitReader(data, (5<<20)+1))
	if err != nil || len(body) == 0 || len(body) > 5<<20 {
		return "", fmt.Errorf("invalid support image")
	}
	_, err = s.client.PutObject(ctx, &s3.PutObjectInput{Bucket: aws.String(bucket), Key: aws.String(key), Body: bytes.NewReader(body), ContentType: aws.String(mime), ContentLength: aws.Int64(int64(len(body))), CacheControl: aws.String("private, no-store")})
	if err != nil {
		return "", err
	}
	return ref, nil
}
func (s *r2Store) OpenSupport(ctx context.Context, ref string) (io.ReadCloser, string, error) {
	key, ok := SupportKey(ref)
	if !ok {
		return nil, "", fmt.Errorf("invalid support reference")
	}
	bucket, err := s.receiptBucket()
	if err != nil {
		return nil, "", err
	}
	object, err := s.client.GetObject(ctx, &s3.GetObjectInput{Bucket: aws.String(bucket), Key: aws.String(key)})
	if err != nil {
		return nil, "", err
	}
	return object.Body, DetectContentType(key, nil), nil
}
func (s *localStore) UploadSupport(_ context.Context, name string, data io.Reader, _ int64, _ string) (string, error) {
	ref := SupportReference(name)
	if _, ok := SupportKey(ref); !ok {
		return "", fmt.Errorf("invalid support reference")
	}
	dir := s.dir + "-private/soporte"
	if err := os.MkdirAll(dir, 0700); err != nil {
		return "", err
	}
	root, err := os.OpenRoot(dir)
	if err != nil {
		return "", err
	}
	defer root.Close()
	file, err := root.OpenFile(name, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0600)
	if err != nil {
		return "", err
	}
	size, copyErr := io.Copy(file, io.LimitReader(data, (5<<20)+1))
	closeErr := file.Close()
	if copyErr != nil || closeErr != nil || size < 1 || size > 5<<20 {
		root.Remove(name)
		return "", fmt.Errorf("support image write failed")
	}
	return ref, nil
}
func (s *localStore) OpenSupport(_ context.Context, ref string) (io.ReadCloser, string, error) {
	key, ok := SupportKey(ref)
	if !ok {
		return nil, "", fmt.Errorf("invalid support reference")
	}
	root, err := os.OpenRoot(s.dir + "-private/soporte")
	if err != nil {
		return nil, "", err
	}
	defer root.Close()
	file, err := root.Open(filepath.Base(key))
	return file, DetectContentType(key, nil), err
}
