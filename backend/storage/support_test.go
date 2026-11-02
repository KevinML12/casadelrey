package storage

import (
	"context"
	"github.com/stretchr/testify/require"
	"io"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestSupportFilesArePrivateAndSeparatedFromReceipts(t *testing.T) {
	dir := filepath.Join(t.TempDir(), "uploads")
	store, err := newLocalStore(dir, "http://localhost")
	require.NoError(t, err)
	ref, err := store.UploadSupport(context.Background(), testReceiptName, strings.NewReader("private screenshot"), 18, "image/png")
	require.NoError(t, err)
	require.Equal(t, SupportReference(testReceiptName), ref)
	require.NoFileExists(t, filepath.Join(dir, "soporte", testReceiptName))
	require.FileExists(t, filepath.Join(dir+"-private", "soporte", testReceiptName))
	file, mime, err := store.OpenSupport(context.Background(), ref)
	require.NoError(t, err)
	defer file.Close()
	data, err := io.ReadAll(file)
	require.NoError(t, err)
	require.Equal(t, "private screenshot", string(data))
	require.Equal(t, "image/png", mime)
	_, err = store.Upload(context.Background(), "soporte", testReceiptName, strings.NewReader("private screenshot"), 18, "image/png")
	require.Error(t, err)
	for _, invalid := range []string{ReceiptReference(testReceiptName), SupportReference("../" + testReceiptName), SupportReference(testReceiptName + "?token=x"), "https://example.invalid/photo.png"} {
		_, ok := SupportKey(invalid)
		require.False(t, ok)
		_, _, err = store.OpenSupport(context.Background(), invalid)
		require.Error(t, err)
	}
	outside := filepath.Join(filepath.Dir(dir), "outside.txt")
	require.NoError(t, os.WriteFile(outside, []byte("outside"), 0600))
	name := "11234567-89ab-4cde-8012-3456789abcde.png"
	require.NoError(t, os.Symlink(outside, filepath.Join(dir+"-private", "soporte", name)))
	_, _, err = store.OpenSupport(context.Background(), SupportReference(name))
	require.Error(t, err)
}
func TestSupportR2RequiresSeparatePrivateBucket(t *testing.T) {
	for _, bucket := range []string{"", "media"} {
		store := &r2Store{bucket: "media", privateBucket: bucket}
		_, err := store.UploadSupport(context.Background(), testReceiptName, strings.NewReader("private"), 7, "image/png")
		require.Error(t, err)
		_, _, err = store.OpenSupport(context.Background(), SupportReference(testReceiptName))
		require.Error(t, err)
	}
}
