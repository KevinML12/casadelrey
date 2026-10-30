package email

import (
	"bytes"
	"casadelrey/backend/config"
	"casadelrey/backend/models"
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/google/uuid"
	xhtml "golang.org/x/net/html"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"html"
	"io"
	"log"
	"net/http"
	"net/mail"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"time"
)

const brevoSendURL = "https://api.brevo.com/v3/smtp/email"

type Message struct {
	Key, Kind, To, Subject, HTML string
	ExpiresAt                    time.Time
}
type payload struct {
	HTML string `json:"html"`
	Text string `json:"text"`
}
type contact struct {
	Name  string `json:"name,omitempty"`
	Email string `json:"email"`
}
type sendRequest struct {
	Sender  contact           `json:"sender"`
	To      []contact         `json:"to"`
	ReplyTo *contact          `json:"replyTo,omitempty"`
	Subject string            `json:"subject"`
	HTML    string            `json:"htmlContent"`
	Text    string            `json:"textContent"`
	Headers map[string]string `json:"headers"`
}

func ValidAddress(value string) bool {
	a, err := mail.ParseAddress(strings.TrimSpace(value))
	return err == nil && a.Address == strings.TrimSpace(value) && !strings.ContainsAny(value, "\r\n")
}
func Ready(cfg *config.Config) bool {
	return cfg != nil && cfg.BrevoKey != "" && ValidAddress(cfg.MailFromEmail) && cfg.ClientURL != "" && cfg.JWTSecret != ""
}
func textVersion(markup string) string {
	doc, err := xhtml.Parse(strings.NewReader(markup))
	if err != nil {
		return "Casa del Rey"
	}
	var out strings.Builder
	var walk func(*xhtml.Node)
	walk = func(n *xhtml.Node) {
		if n.Type == xhtml.ElementNode && (n.Data == "style" || n.Data == "script" || n.Data == "head") {
			return
		}
		if n.Type == xhtml.TextNode {
			out.WriteString(n.Data)
		}
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			walk(c)
		}
		if n.Type == xhtml.ElementNode {
			if n.Data == "a" {
				for _, a := range n.Attr {
					if a.Key == "href" {
						out.WriteString(" (" + a.Val + ")")
					}
				}
			}
			if n.Data == "p" || n.Data == "tr" || n.Data == "h1" || n.Data == "br" {
				out.WriteByte('\n')
			}
		}
	}
	walk(doc)
	return strings.TrimSpace(out.String())
}
func cryptPayload(value []byte, secret string, decrypt bool) ([]byte, error) {
	if secret == "" {
		return nil, errors.New("mail encryption secret is missing")
	}
	key := sha256.Sum256([]byte("casadelrey/email-outbox/v1/" + secret))
	block, err := aes.NewCipher(key[:])
	if err != nil {
		return nil, err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}
	if decrypt {
		if len(value) < gcm.NonceSize() {
			return nil, errors.New("invalid mail payload")
		}
		return gcm.Open(nil, value[:gcm.NonceSize()], value[gcm.NonceSize():], nil)
	}
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, err
	}
	return gcm.Seal(nonce, nonce, value, nil), nil
}

// Enqueue uses the business transaction. Duplicate keys do not send twice.
func Enqueue(tx *gorm.DB, m Message) error {
	if strings.TrimSpace(m.To) == "" {
		return nil
	}
	if !ValidAddress(m.To) {
		return errors.New("invalid mail recipient")
	}
	if config.AppConfig == nil {
		return errors.New("mail configuration unavailable")
	}
	if m.Key == "" {
		m.Key = uuid.NewString()
	}
	if m.ExpiresAt.IsZero() {
		m.ExpiresAt = time.Now().Add(24 * time.Hour)
	}
	if strings.Contains(m.HTML, "__CDR_EMAIL_BG__") {
		var rows []models.SitePhoto
		if err := tx.Where("key IN ?", []string{"email_fondo", "about_comunidad", "hero_donar"}).Find(&rows).Error; err != nil {
			return err
		}
		choices := map[string]string{}
		for _, r := range rows {
			choices[r.Key] = r.ImageURL
		}
		background := strings.TrimRight(config.AppConfig.ClientURL, "/") + "/images/public_bg_donaciones.jpg"
		for _, key := range []string{"email_fondo", "about_comunidad", "hero_donar"} {
			if choices[key] != "" {
				candidate, err := url.Parse(choices[key])
				if err == nil && candidate.Scheme == "https" && candidate.Host != "" {
					background = candidate.String()
					break
				}
			}
		}
		background = strings.NewReplacer("'", "%27", "\"", "%22", "(", "%28", ")", "%29").Replace(background)
		m.HTML = strings.ReplaceAll(m.HTML, "__CDR_EMAIL_BG__", html.EscapeString(background))
	}
	data, err := json.Marshal(payload{m.HTML, textVersion(m.HTML)})
	if err != nil {
		return err
	}
	sealed, err := cryptPayload(data, config.AppConfig.JWTSecret, false)
	if err != nil {
		return err
	}
	row := models.EmailMessage{EventKey: m.Key, SendKey: uuid.NewString(), Kind: m.Kind, Recipient: strings.TrimSpace(m.To), Subject: m.Subject, Payload: base64.StdEncoding.EncodeToString(sealed), Status: "pending", NextAttemptAt: time.Now(), ExpiresAt: m.ExpiresAt}
	return tx.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "event_key"}}, DoNothing: true}).Create(&row).Error
}

type Service struct {
	DB       *gorm.DB
	Config   *config.Config
	Client   *http.Client
	endpoint string
}

func NewService(db *gorm.DB, cfg *config.Config) *Service {
	return &Service{DB: db, Config: cfg, Client: &http.Client{Timeout: 12 * time.Second}, endpoint: brevoSendURL}
}

var defaultMu sync.RWMutex
var defaultService *Service

func SetDefault(s *Service) { defaultMu.Lock(); defaultService = s; defaultMu.Unlock() }

// Compatibility callers persist synchronously; there is no untracked goroutine.
func SendEmail(to, subject, html string) error {
	defaultMu.RLock()
	s := defaultService
	defaultMu.RUnlock()
	if s == nil {
		return errors.New("mail outbox unavailable")
	}
	return Enqueue(s.DB, Message{To: to, Subject: subject, HTML: html, Kind: "notification"})
}
func SendEmailAsync(to, subject, html string) {
	if err := SendEmail(to, subject, html); err != nil {
		log.Print("[Mail] Could not queue notification; recipient and content omitted")
	}
}
func (s *Service) Run(ctx context.Context) {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()
	for {
		if err := s.Tick(ctx); err != nil && ctx.Err() == nil {
			log.Print("[Mail] Outbox cycle failed; retained for review")
		}
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
	}
}

// A network timeout or expired processing lease is uncertain: never blindly
// resend an email that might already have been accepted by the provider.
func (s *Service) Tick(ctx context.Context) error {
	now := time.Now()
	if err := s.DB.WithContext(ctx).Model(&models.EmailMessage{}).Where("status IN ? AND expires_at <= ?", []string{"pending", "failed", "processing", "uncertain"}, now).Updates(map[string]interface{}{"status": "expired", "payload": "", "lease_token": "", "lease_until": nil}).Error; err != nil {
		return err
	}
	if err := s.DB.WithContext(ctx).Model(&models.EmailMessage{}).Where("status = ? AND lease_until < ?", "processing", now).Updates(map[string]interface{}{"status": "uncertain", "last_error": "delivery_unknown", "lease_token": "", "lease_until": nil}).Error; err != nil {
		return err
	}
	if err := s.DB.WithContext(ctx).Model(&models.EmailMessage{}).Where("status = ? AND retry_until < ?", "pending", now).Updates(map[string]interface{}{"status": "uncertain", "last_error": "retry_window_expired"}).Error; err != nil {
		return err
	}
	if !Ready(s.Config) {
		return nil
	}
	var row models.EmailMessage
	err := s.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// A rolling 24-hour cap leaves a margin inside Brevo Free's 300/day.
		if tx.Dialector.Name() == "postgres" {
			if err := tx.Exec("SELECT pg_advisory_xact_lock(739012650)").Error; err != nil {
				return err
			}
		}
		var reserved int64
		if err := tx.Model(&models.EmailMessage{}).Where("(status = ? AND accepted_at > ?) OR status = ?", "accepted", time.Now().Add(-24*time.Hour), "processing").Count(&reserved).Error; err != nil {
			return err
		}
		if reserved >= 250 {
			return gorm.ErrRecordNotFound
		}
		query := tx.Clauses(clause.Locking{Strength: "UPDATE", Options: "SKIP LOCKED"}).Where("status = ? AND next_attempt_at <= ? AND expires_at > ?", "pending", now, now).Order("CASE WHEN kind IN ('password_reset','verification','event_cancellation_code') THEN 0 ELSE 1 END").Order("expires_at").Order("id").Limit(1).Find(&row)
		if query.Error != nil {
			return query.Error
		}
		if query.RowsAffected == 0 {
			return gorm.ErrRecordNotFound
		}
		lease := now.Add(time.Minute)
		row.LeaseToken = uuid.NewString()
		row.Status = "processing"
		row.Attempts++
		row.LeaseUntil = &lease
		return tx.Save(&row).Error
	})
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil
	}
	if err != nil {
		return err
	}
	update := map[string]interface{}{"lease_token": "", "lease_until": nil}
	encoded, err := base64.StdEncoding.DecodeString(row.Payload)
	var body payload
	if err == nil {
		encoded, err = cryptPayload(encoded, s.Config.JWTSecret, true)
	}
	if err == nil {
		err = json.Unmarshal(encoded, &body)
	}
	if err != nil {
		update["status"] = "failed"
		update["last_error"] = "payload_unreadable"
		return s.complete(ctx, row, update)
	}
	reqBody := sendRequest{Sender: contact{s.Config.MailFromName, s.Config.MailFromEmail}, To: []contact{{Email: row.Recipient}}, Subject: row.Subject, HTML: body.HTML, Text: body.Text, Headers: map[string]string{"idempotencyKey": row.SendKey}}
	if ValidAddress(s.Config.MailReplyTo) {
		reqBody.ReplyTo = &contact{Email: s.Config.MailReplyTo}
	}
	data, _ := json.Marshal(reqBody)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, s.endpoint, bytes.NewReader(data))
	if err != nil {
		return err
	}
	req.Header.Set("api-key", s.Config.BrevoKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	resp, err := s.Client.Do(req)
	if err != nil {
		update["status"] = "uncertain"
		update["last_error"] = "delivery_unknown"
		return s.complete(context.WithoutCancel(ctx), row, update)
	}
	defer resp.Body.Close()
	limited, _ := io.ReadAll(io.LimitReader(resp.Body, 32768))
	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		var result struct {
			ID string `json:"messageId"`
		}
		_ = json.Unmarshal(limited, &result)
		if result.ID == "" {
			update["status"] = "uncertain"
			update["last_error"] = "missing_provider_id"
		} else {
			update["status"] = "accepted"
			update["provider_id"] = result.ID
			update["accepted_at"] = time.Now()
			update["last_error"] = ""
			update["payload"] = ""
		}
	} else if resp.StatusCode == 429 || resp.StatusCode >= 500 || resp.StatusCode == 408 {
		update["status"] = "pending"
		update["last_error"] = fmt.Sprintf("provider_%d", resp.StatusCode)
		delay := time.Duration(1<<min(row.Attempts-1, 3)) * 15 * time.Second
		if resp.StatusCode != 429 {
			until := time.Now().Add(10 * time.Minute)
			if row.RetryUntil != nil {
				until = *row.RetryUntil
			}
			update["retry_until"] = until
		} else {
			update["retry_until"] = nil
		}
		if seconds, e := strconv.Atoi(resp.Header.Get("Retry-After")); e == nil && seconds > 0 {
			delay = max(delay, time.Duration(min(seconds, 86400))*time.Second)
		}
		update["next_attempt_at"] = time.Now().Add(delay)
		if row.Attempts >= 5 {
			update["status"] = "failed"
		}
	} else {
		var providerError struct {
			Code string `json:"code"`
		}
		_ = json.Unmarshal(limited, &providerError)
		if providerError.Code == "duplicate_parameter" {
			update["status"] = "uncertain"
			update["last_error"] = "provider_duplicate"
		} else {
			update["status"] = "failed"
			update["last_error"] = fmt.Sprintf("provider_%d", resp.StatusCode)
		}
	}
	return s.complete(ctx, row, update)
}
func (s *Service) complete(ctx context.Context, row models.EmailMessage, update map[string]interface{}) error {
	return s.DB.WithContext(ctx).Model(&models.EmailMessage{}).Where("id = ? AND status = ? AND lease_token = ?", row.ID, "processing", row.LeaseToken).Updates(update).Error
}
