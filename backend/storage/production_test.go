package storage

import "testing"

func TestProductionCannotFallBackToEphemeralStorage(t *testing.T) {
	base := map[string]string{"ENV": "production", "CF_R2_ACCOUNT_ID": "controlled-account", "CF_R2_ACCESS_KEY": "fixture", "CF_R2_SECRET_KEY": "fixture", "CF_R2_BUCKET": "public-media", "CF_R2_PRIVATE_BUCKET": "private-receipts", "CF_R2_PUBLIC_URL": "https://media.example.invalid"}
	for _, missing := range []string{"CF_R2_ACCOUNT_ID", "CF_R2_ACCESS_KEY", "CF_R2_SECRET_KEY", "CF_R2_BUCKET", "CF_R2_PRIVATE_BUCKET", "CF_R2_PUBLIC_URL"} {
		t.Run(missing, func(t *testing.T) {
			for key, value := range base {
				t.Setenv(key, value)
			}
			t.Setenv(missing, "")
			defer func() {
				if recover() == nil {
					t.Fatal("production silently accepted ephemeral storage")
				}
			}()
			New()
		})
	}
	t.Run("shared bucket", func(t *testing.T) {
		for key, value := range base {
			t.Setenv(key, value)
		}
		t.Setenv("CF_R2_PRIVATE_BUCKET", "public-media")
		defer func() {
			if recover() == nil {
				t.Fatal("receipts share a public bucket")
			}
		}()
		New()
	})
	t.Run("valid isolated buckets", func(t *testing.T) {
		for key, value := range base {
			t.Setenv(key, value)
		}
		if New().ActiveBackend() != BackendR2 {
			t.Fatal("durable storage was not selected")
		}
	})
}
