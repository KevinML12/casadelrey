// Package operations provides offline recovery tools. It is not an HTTP API.
package operations

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"io"
	"os"
	"path/filepath"
)

const envelope = "CDRBACKUP1"

func Digest(data []byte) string { sum := sha256.Sum256(data); return hex.EncodeToString(sum[:]) }

func Seal(key, data []byte) ([]byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil || len(key) != 32 {
		return nil, errors.New("a separate 32-byte backup key is required")
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}
	nonce := make([]byte, gcm.NonceSize())
	if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, err
	}
	header := append([]byte(envelope), nonce...)
	return gcm.Seal(header, nonce, data, []byte(envelope)), nil
}

func Open(key, data []byte) ([]byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil || len(key) != 32 {
		return nil, errors.New("a separate 32-byte backup key is required")
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}
	start := len(envelope)
	if len(data) < start+gcm.NonceSize()+gcm.Overhead() || string(data[:start]) != envelope {
		return nil, errors.New("invalid backup envelope")
	}
	return gcm.Open(nil, data[start:start+gcm.NonceSize()], data[start+gcm.NonceSize():], []byte(envelope))
}

func SavePrivate(path string, data []byte) error {
	f, err := os.CreateTemp(filepath.Dir(path), ".backup-*")
	if err != nil {
		return err
	}
	defer os.Remove(f.Name())
	_, err = f.Write(data)
	if err == nil {
		err = f.Sync()
	}
	closeErr := f.Close()
	if err != nil {
		return err
	}
	if closeErr != nil {
		return closeErr
	}
	// Link is atomic and refuses to overwrite an existing snapshot.
	return os.Link(f.Name(), path)
}
