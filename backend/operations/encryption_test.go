package operations

import (
	"bytes"
	"testing"
)

func TestBackupAuthenticationAndRecovery(t *testing.T) {
	key := bytes.Repeat([]byte{7}, 32)
	plain := []byte("private financial archive")
	sealed, err := Seal(key, plain)
	if err != nil {
		t.Fatal(err)
	}
	second, _ := Seal(key, plain)
	if bytes.Equal(sealed, second) || bytes.Contains(sealed, plain) {
		t.Fatal("backup must use unique nonces and conceal plaintext")
	}
	opened, err := Open(key, sealed)
	if err != nil || !bytes.Equal(plain, opened) {
		t.Fatal("backup cannot be recovered", err)
	}
	for _, mutate := range []func([]byte){func(b []byte) { b[len(b)-1] ^= 1 }, func(b []byte) { b[len(envelope)] ^= 1 }, func(b []byte) { b[0] ^= 1 }} {
		copy := append([]byte{}, sealed...)
		mutate(copy)
		if _, err := Open(key, copy); err == nil {
			t.Fatal("tampering was accepted")
		}
	}
	if _, err := Open(bytes.Repeat([]byte{8}, 32), sealed); err == nil {
		t.Fatal("wrong key was accepted")
	}
	if _, err := Open(key, sealed[:5]); err == nil {
		t.Fatal("truncated backup was accepted")
	}
}
