package storage

import (
	"context"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

const testReceiptName = "01234567-89ab-4cde-8012-3456789abcde.png"

func TestLocalReceiptIsOutsidePublicDirectory(t *testing.T) {
	dir := filepath.Join(t.TempDir(), "uploads")
	s, err := newLocalStore(dir, "http://localhost")
	require.NoError(t, err)
	ref, err := s.UploadReceipt(context.Background(), testReceiptName, strings.NewReader("private fixture"), 15, "image/png")
	require.NoError(t, err)
	require.Equal(t, ReceiptReference(testReceiptName), ref)
	require.NoFileExists(t, filepath.Join(dir, "comprobantes", testReceiptName))
	_, err = s.Upload(context.Background(), "comprobantes", testReceiptName, strings.NewReader("private"), 7, "image/png")
	require.Error(t, err)
	info, err := os.Stat(filepath.Join(dir+"-private", testReceiptName))
	require.NoError(t, err)
	require.EqualValues(t, 0600, info.Mode().Perm())
	f, contentType, err := s.OpenReceipt(context.Background(), ref)
	require.NoError(t, err)
	defer f.Close()
	data, err := io.ReadAll(f)
	require.NoError(t, err)
	require.Equal(t, "private fixture", string(data))
	require.Equal(t, "image/png", contentType)
	// A private filename cannot overwrite a previous upload.
	_, err = s.UploadReceipt(context.Background(), testReceiptName, strings.NewReader("replacement"), 11, "image/png")
	require.Error(t, err)
}

func TestReceiptPathsAndSymlinksCannotEscape(t *testing.T) {
	dir := filepath.Join(t.TempDir(), "uploads")
	s, err := newLocalStore(dir, "http://localhost")
	require.NoError(t, err)
	for _, ref := range []string{"https://example.invalid/photo.png", ReceiptReference("../outside.png"), ReceiptReference(testReceiptName + "?token=x"), ReceiptReference("/" + testReceiptName)} {
		_, ok := ReceiptKey(ref)
		require.False(t, ok)
		_, _, err := s.OpenReceipt(context.Background(), ref)
		require.Error(t, err)
	}
	require.NoError(t, os.MkdirAll(dir+"-private", 0700))
	outside := filepath.Join(filepath.Dir(dir), "outside.txt")
	require.NoError(t, os.WriteFile(outside, []byte("outside secret"), 0600))
	require.NoError(t, os.Symlink(outside, filepath.Join(dir+"-private", testReceiptName)))
	_, _, err = s.OpenReceipt(context.Background(), ReceiptReference(testReceiptName))
	require.Error(t, err)
}

func TestR2ReceiptFailsClosedWithoutSeparateBucket(t *testing.T) {
	for _, bucket := range []string{"", "public-media"} {
		s := &r2Store{bucket: "public-media", privateBucket: bucket}
		_, err := s.UploadReceipt(context.Background(), testReceiptName, strings.NewReader("private"), 7, "image/png")
		require.Error(t, err)
		_, _, err = s.OpenReceipt(context.Background(), ReceiptReference(testReceiptName))
		require.Error(t, err)
	}
}

func TestR2ReceiptUsesPrivateBucketForUploadAndRead(t *testing.T) {
	var paths []string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		paths = append(paths, r.Method+" "+r.URL.Path)
		if r.Method == http.MethodPut {
			require.Equal(t, "private, no-store", r.Header.Get("Cache-Control"))
			w.Header().Set("ETag", `"fixture"`)
		} else {
			w.Header().Set("Content-Type", "image/png")
			_, _ = w.Write([]byte("private fixture"))
		}
	}))
	defer server.Close()
	client := s3.NewFromConfig(aws.Config{Region: "auto", Credentials: credentials.NewStaticCredentialsProvider("fixture", "fixture", "")}, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(server.URL)
		o.UsePathStyle = true
	})
	s := &r2Store{client: client, bucket: "public-media", privateBucket: "private-receipts"}
	ref, err := s.UploadReceipt(context.Background(), testReceiptName, strings.NewReader("private fixture"), 15, "image/png")
	require.NoError(t, err)
	f, contentType, err := s.OpenReceipt(context.Background(), ref)
	require.NoError(t, err)
	data, err := io.ReadAll(f)
	require.NoError(t, err)
	require.NoError(t, f.Close())
	require.Equal(t, "private fixture", string(data))
	require.Equal(t, "image/png", contentType)
	require.Equal(t, []string{"PUT /private-receipts/comprobantes/" + testReceiptName, "GET /private-receipts/comprobantes/" + testReceiptName}, paths)
}
