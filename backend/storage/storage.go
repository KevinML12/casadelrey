// Package storage abstrae el almacenamiento de archivos.
// Soporta dos backends intercambiables via variables de entorno:
//
//   - Cloudflare R2 (producción) — cuando CF_R2_ACCOUNT_ID está configurado
//   - Sistema de archivos local (desarrollo) — fallback automático
//
// Para cambiar de cuenta (tuya ↔ del cliente) solo se cambian las
// variables de entorno CF_R2_* sin tocar una línea de código.
package storage

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// Backend identifica qué motor de almacenamiento está activo.
type Backend string

const (
	BackendR2    Backend = "r2"
	BackendLocal Backend = "local"
)

// Store es la interfaz única de almacenamiento.
// El resto del código solo habla con Store — nunca con R2 o disco directamente.
type Store interface {
	// Upload guarda un archivo y retorna su URL pública.
	Upload(ctx context.Context, folder string, filename string, data io.Reader, size int64, contentType string) (string, error)
	// Delete elimina un archivo por su key (ruta relativa en el bucket).
	Delete(ctx context.Context, key string) error
	// Backend retorna qué motor está activo ("r2" o "local").
	ActiveBackend() Backend
}

// ── R2 Store ──────────────────────────────────────────────────────────────────

type r2Store struct {
	client    *s3.Client
	bucket    string
	publicURL string // https://cdn.casadelreyhue.org  o  https://pub-xxx.r2.dev
}

func newR2Store(accountID, accessKey, secretKey, bucket, publicURL string) (*r2Store, error) {
	if accountID == "" || accessKey == "" || secretKey == "" || bucket == "" {
		return nil, fmt.Errorf("faltan variables CF_R2_ACCOUNT_ID / CF_R2_ACCESS_KEY / CF_R2_SECRET_KEY / CF_R2_BUCKET")
	}

	endpoint := fmt.Sprintf("https://%s.r2.cloudflarestorage.com", accountID)

	client := s3.NewFromConfig(aws.Config{
		Region: "auto",
		Credentials: credentials.NewStaticCredentialsProvider(
			accessKey, secretKey, "",
		),
	}, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		// R2 no soporta virtual-hosted-style, forzar path-style
		o.UsePathStyle = true
	})

	log.Printf("[Storage] R2 activo — bucket: %s | endpoint: %s", bucket, endpoint)
	return &r2Store{client: client, bucket: bucket, publicURL: strings.TrimRight(publicURL, "/")}, nil
}

func (s *r2Store) Upload(ctx context.Context, folder, filename string, data io.Reader, size int64, contentType string) (string, error) {
	key := buildKey(folder, filename)

	body, err := io.ReadAll(data)
	if err != nil {
		return "", fmt.Errorf("leer archivo: %w", err)
	}

	_, err = s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:        aws.String(s.bucket),
		Key:           aws.String(key),
		Body:          bytes.NewReader(body),
		ContentType:   aws.String(contentType),
		ContentLength: aws.Int64(int64(len(body))),
	})
	if err != nil {
		return "", fmt.Errorf("subir a R2: %w", err)
	}

	url := fmt.Sprintf("%s/%s", s.publicURL, key)
	log.Printf("[Storage] R2 upload OK — key: %s | url: %s", key, url)
	return url, nil
}

func (s *r2Store) Delete(ctx context.Context, key string) error {
	_, err := s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	})
	return err
}

func (s *r2Store) ActiveBackend() Backend { return BackendR2 }

// ── Local Store ───────────────────────────────────────────────────────────────

type localStore struct {
	dir     string // ruta absoluta del directorio
	baseURL string // URL base del servidor, ej. http://localhost:8080
}

func newLocalStore(dir, baseURL string) (*localStore, error) {
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("crear directorio local: %w", err)
	}
	log.Printf("[Storage] Local activo — dir: %s", dir)
	return &localStore{dir: dir, baseURL: strings.TrimRight(baseURL, "/")}, nil
}

func (s *localStore) Upload(_ context.Context, folder, filename string, data io.Reader, _ int64, _ string) (string, error) {
	subDir := filepath.Join(s.dir, folder)
	if err := os.MkdirAll(subDir, 0755); err != nil {
		return "", fmt.Errorf("crear subdirectorio: %w", err)
	}

	destPath := filepath.Join(subDir, filename)
	dst, err := os.Create(destPath)
	if err != nil {
		return "", fmt.Errorf("crear archivo: %w", err)
	}
	defer dst.Close()

	if _, err := io.Copy(dst, data); err != nil {
		return "", fmt.Errorf("escribir archivo: %w", err)
	}

	url := fmt.Sprintf("%s/uploads/%s/%s", s.baseURL, folder, filename)
	return url, nil
}

func (s *localStore) Delete(_ context.Context, key string) error {
	return os.Remove(filepath.Join(s.dir, key))
}

func (s *localStore) ActiveBackend() Backend { return BackendLocal }

// ── Factory ───────────────────────────────────────────────────────────────────

// New crea el Store correcto según las variables de entorno presentes.
//
// Variables para R2 (todas requeridas para activar R2):
//
//	CF_R2_ACCOUNT_ID   — ID de la cuenta Cloudflare (tuya o del cliente)
//	CF_R2_ACCESS_KEY   — Access Key del token R2
//	CF_R2_SECRET_KEY   — Secret Key del token R2
//	CF_R2_BUCKET       — Nombre del bucket (ej. casadelreyhue-media)
//	CF_R2_PUBLIC_URL   — URL pública del bucket (ej. https://cdn.casadelreyhue.org)
//
// Si alguna falta → cae automáticamente a almacenamiento local en ./uploads
func New() Store {
	accountID  := os.Getenv("CF_R2_ACCOUNT_ID")
	accessKey  := os.Getenv("CF_R2_ACCESS_KEY")
	secretKey  := os.Getenv("CF_R2_SECRET_KEY")
	bucket     := os.Getenv("CF_R2_BUCKET")
	publicURL  := os.Getenv("CF_R2_PUBLIC_URL")

	// Si todas las vars R2 están presentes → usar R2
	if accountID != "" && accessKey != "" && secretKey != "" && bucket != "" {
		store, err := newR2Store(accountID, accessKey, secretKey, bucket, publicURL)
		if err == nil {
			return store
		}
		log.Printf("[Storage] R2 no pudo iniciar: %v — usando almacenamiento local", err)
	} else {
		log.Println("[Storage] Variables R2 no configuradas — usando almacenamiento local")
	}

	// Fallback: almacenamiento local
	baseURL := os.Getenv("BASE_URL")
	if baseURL == "" {
		baseURL = "http://localhost:8080"
	}
	store, err := newLocalStore("./uploads", baseURL)
	if err != nil {
		panic(fmt.Sprintf("[Storage] No se pudo iniciar almacenamiento local: %v", err))
	}
	return store
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// buildKey genera la clave del objeto: folder/timestamp_filename.ext
func buildKey(folder, filename string) string {
	if folder == "" {
		return filename
	}
	return fmt.Sprintf("%s/%s", strings.Trim(folder, "/"), filename)
}

// UniqueFilename genera un nombre único para evitar colisiones.
// Formato: 1717200000000000000_nombre_original.jpg
func UniqueFilename(original string) string {
	ext := strings.ToLower(filepath.Ext(original))
	base := sanitize(strings.TrimSuffix(original, filepath.Ext(original)))
	if len(base) > 40 {
		base = base[:40]
	}
	return fmt.Sprintf("%d_%s%s", time.Now().UnixNano(), base, ext)
}

// DetectContentType detecta el MIME type de un archivo por su extensión.
func DetectContentType(filename string, data []byte) string {
	ext := strings.ToLower(filepath.Ext(filename))
	switch ext {
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".webp":
		return "image/webp"
	case ".gif":
		return "image/gif"
	case ".pdf":
		return "application/pdf"
	}
	if ct := mime.TypeByExtension(ext); ct != "" {
		return ct
	}
	if len(data) > 512 {
		return http.DetectContentType(data[:512])
	}
	return "application/octet-stream"
}

func sanitize(name string) string {
	r := strings.NewReplacer(" ", "_", "/", "", "\\", "", "..", "", "<", "", ">", "", ":", "", "\"", "", "|", "", "?", "", "*", "")
	return r.Replace(name)
}
