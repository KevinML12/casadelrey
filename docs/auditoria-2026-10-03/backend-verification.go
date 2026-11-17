// Reproductor de auditoría: router real, JWT de prueba y SQLite en memoria.
package main

import (
	"bytes"
	"casadelrey/backend/auth"
	"casadelrey/backend/config"
	"casadelrey/backend/models"
	"casadelrey/backend/routes"
	"casadelrey/backend/storage"
	"context"
	"encoding/json"
	"fmt"
	"github.com/DATA-DOG/go-sqlmock"
	"github.com/glebarez/sqlite"
	"github.com/labstack/echo/v4"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"time"
)

type fakeStorage struct{}

func (fakeStorage) Upload(_ context.Context, folder, filename string, _ io.Reader, _ int64, _ string) (string, error) {
	return "https://example.invalid/" + folder + "/" + filename, nil
}
func (fakeStorage) Delete(context.Context, string) error { return nil }
func (fakeStorage) ActiveBackend() storage.Backend       { return storage.Backend("audit-memory") }

type blockNetwork struct{}

func (blockNetwork) RoundTrip(*http.Request) (*http.Response, error) {
	return nil, fmt.Errorf("external network disabled in audit")
}

type Case struct {
	Name     string      `json:"name"`
	Status   int         `json:"status"`
	Expected int         `json:"expected_current_status"`
	Matches  bool        `json:"matches_current_behavior"`
	Detail   interface{} `json:"detail,omitempty"`
}

var cases []Case
var seq int

func add(n string, s, w int, d interface{}) { cases = append(cases, Case{n, s, w, s == w, d}) }
func request(e *echo.Echo, m, p, t string, body interface{}) *httptest.ResponseRecorder {
	var b io.Reader
	if body != nil {
		j, _ := json.Marshal(body)
		b = bytes.NewReader(j)
	}
	q := httptest.NewRequest(m, p, b)
	q.Header.Set("Content-Type", "application/json")
	if t != "" {
		q.Header.Set("Authorization", "Bearer "+t)
	}
	seq++
	q.RemoteAddr = fmt.Sprintf("192.0.2.%d:10000", seq)
	r := httptest.NewRecorder()
	e.ServeHTTP(r, q)
	return r
}
func ptr(x uint) *uint { return &x }
func main() {
	http.DefaultClient.Transport = blockNetwork{}
	cfg := &config.Config{JWTSecret: "audit-only-secret-not-production", ClientURL: "https://example.invalid"}
	config.AppConfig = cfg
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{Logger: logger.Default.LogMode(logger.Silent)})
	if err != nil {
		panic(err)
	}
	if err = db.AutoMigrate(&models.User{}, &models.Cell{}, &models.Post{}, &models.Announcement{}, &models.GalleryPhoto{}, &models.SocialPost{}, &models.FAQ{}, &models.CellCategory{}, &models.CellReport{}, &models.VolunteerReport{}, &models.MemberBoleta{}, &models.Event{}, &models.EventRegistration{}, &models.PaymentReceipt{}, &models.Donation{}, &models.DonationPurpose{}, &models.Leader{}, &models.Volunteer{}, &models.VolunteerArea{}, &models.Petition{}, &models.ConnectCard{}, &models.HeroSetting{}, &models.SitePhoto{}, &models.SiteSetting{}, &models.UserGoal{}, &models.ActivityLog{}); err != nil {
		panic(err)
	}
	tokens := map[string]string{}
	users := map[string]models.User{}
	for _, role := range []string{"admin", "leader", "volunteer", "member"} {
		pass, _ := auth.HashPassword("AuditPassword123!")
		u := models.User{Name: "Audit " + role, Email: role + "@example.invalid", Password: pass, Role: role, EmailVerified: true, Address: "private address", Phone: "private phone"}
		if err = db.Create(&u).Error; err != nil {
			panic(err)
		}
		users[role] = u
		tokens[role], _ = auth.GenerateJWT(u.ID, u.Name, u.Email, u.Role)
	}
	e := echo.New()
	routes.Register(e, db, cfg, fakeStorage{})
	for _, role := range []string{"anonymous", "member", "volunteer", "leader", "admin"} {
		r := request(e, "GET", "/api/v1/admin/kpis", tokens[role], nil)
		w := 403
		if role == "anonymous" {
			w = 401
		}
		if role == "admin" {
			w = 200
		}
		add("admin KPIs role="+role, r.Code, w, nil)
	}
	r := request(e, "GET", "/api/v1/admin/kpis", tokens["admin"][:len(tokens["admin"])-4]+"xxxx", nil)
	add("forged JWT rejected", r.Code, 401, nil)
	for _, role := range []string{"member", "volunteer", "leader", "admin"} {
		r := request(e, "GET", "/api/v1/leader/kpis", tokens[role], nil)
		w := 403
		if role == "leader" || role == "admin" {
			w = 200
		}
		add("leader KPIs role="+role, r.Code, w, nil)
	}
	report := map[string]interface{}{"volunteer_name": "Audit reporter", "area": "audit", "service_date": "2026-10-03", "team_attendance": 1}
	for _, role := range []string{"volunteer", "leader", "admin"} {
		r := request(e, "POST", "/api/v1/admin/volunteer-reports", tokens[role], report)
		w := 201
		if role == "volunteer" {
			w = 403
		}
		add("create service report role="+role, r.Code, w, nil)
	}
	for _, role := range []string{"volunteer", "leader"} {
		var b bytes.Buffer
		w := multipart.NewWriter(&b)
		f, _ := w.CreateFormFile("file", "audit.jpg")
		f.Write([]byte("plain text, not JPEG"))
		w.Close()
		q := httptest.NewRequest("POST", "/api/v1/upload", &b)
		q.Header.Set("Content-Type", w.FormDataContentType())
		q.Header.Set("Authorization", "Bearer "+tokens[role])
		seq++
		q.RemoteAddr = fmt.Sprintf("192.0.2.%d:10000", seq)
		r := httptest.NewRecorder()
		e.ServeHTTP(r, q)
		want := 201
		if role == "volunteer" {
			want = 403
		}
		add("upload invalid JPEG role="+role, r.Code, want, nil)
	}
	other := models.VolunteerReport{VolunteerID: ptr(users["volunteer"].ID), VolunteerName: "Other owner", Area: "audit", ServiceDate: "2026-10-03", Status: "pendiente"}
	db.Create(&other)
	r = request(e, "PUT", fmt.Sprintf("/api/v1/admin/volunteer-reports/%d/approve", other.ID), tokens["leader"], map[string]string{"status": "aprobado"})
	db.First(&other, other.ID)
	add("leader approves another user's service report", r.Code, 200, map[string]interface{}{"stored_status": other.Status, "owner_id": *other.VolunteerID, "actor_id": users["leader"].ID})
	card := models.ConnectCard{Name: "Other leader visitor", Category: "busco_celula", LeaderAssignedID: ptr(users["admin"].ID)}
	db.Create(&card)
	r = request(e, "GET", "/api/v1/admin/connect-cards", tokens["leader"], nil)
	add("leader can list cards assigned elsewhere", r.Code, 200, map[string]bool{"other_record_visible": strings.Contains(r.Body.String(), card.Name)})
	r = request(e, "PUT", fmt.Sprintf("/api/v1/admin/connect-cards/%d", card.ID), tokens["leader"], map[string]string{"notes": "Changed by another leader"})
	db.First(&card, card.ID)
	add("leader modifies card assigned elsewhere", r.Code, 200, map[string]string{"stored_notes": card.Notes})
	event := models.Event{Title: "Audit paid event", IsActive: true, RequiresPayment: true, PriceGTQ: 100, Capacity: 10}
	db.Create(&event)
	receipt := models.PaymentReceipt{PayerName: "Audit payer", PayerEmail: "payer@example.invalid", Amount: 1, EventID: &event.ID, Purpose: "evento", Status: "verificado", ReceiptImageURL: "https://example.invalid/receipt.jpg"}
	db.Create(&receipt)
	r = request(e, "POST", fmt.Sprintf("/api/v1/events/%d/rsvp", event.ID), "", map[string]interface{}{"name": "Audit guest", "email": receipt.PayerEmail, "attendee_count": 5})
	var reg models.EventRegistration
	db.Where("event_id = ?", event.ID).First(&reg)
	add("Q1 verified receipt reserves five Q100 seats", r.Code, 201, map[string]interface{}{"payment_status": reg.PaymentStatus, "paid_amount": receipt.Amount, "required_amount": 500, "registered_attendees": reg.AttendeeCount})
	r = request(e, "DELETE", fmt.Sprintf("/api/v1/events/%d/rsvp?email=payer@example.invalid", event.ID), "", nil)
	var count int64
	db.Model(&models.EventRegistration{}).Where("id = ?", reg.ID).Count(&count)
	add("anonymous cancellation of another registration", r.Code, 200, map[string]int64{"rows_remaining": count})
	r = request(e, "POST", "/api/v1/donations/register", "", map[string]interface{}{"name": "Audit intention", "amount": 100, "payment_method": "presencial", "currency": "USD"})
	var donation models.Donation
	db.Last(&donation)
	add("public donation counted successful", r.Code, 201, map[string]interface{}{"successful": donation.IsSuccessful, "currency": donation.Currency})
	u := users["member"]
	refresh := "audit-refresh-reset"
	reset := "audit-password-reset"
	exp := time.Now().Add(time.Hour)
	u.RefreshToken = &refresh
	u.RefreshTokenExpiry = &exp
	u.ResetToken = &reset
	u.ResetTokenExpiry = &exp
	db.Save(&u)
	r = request(e, "POST", "/api/v1/auth/reset-password", "", map[string]string{"token": reset, "password": "NewAuditPassword123!"})
	add("frontend reset payload rejected", r.Code, 400, nil)
	r = request(e, "POST", "/api/v1/auth/reset-password", "", map[string]string{"token": reset, "newPassword": "NewAuditPassword123!"})
	add("backend reset payload accepted", r.Code, 200, nil)
	r = request(e, "POST", "/api/v1/auth/refresh", "", map[string]string{"refresh_token": refresh})
	add("old refresh survives password reset", r.Code, 200, nil)
	r = request(e, "GET", "/api/v1/profile/goals", tokens["member"], nil)
	add("old access JWT survives password reset", r.Code, 200, nil)
	u = users["admin"]
	r = request(e, "PUT", fmt.Sprintf("/api/v1/admin/users/%d/role", u.ID), tokens["admin"], map[string]string{"role": "member"})
	add("admin role demoted in DB", r.Code, 200, nil)
	r = request(e, "GET", "/api/v1/admin/kpis", tokens["admin"], nil)
	add("old admin JWT still accesses admin after demotion", r.Code, 200, nil)
	db.Model(&models.User{}).Where("id = ?", u.ID).Update("role", "admin")
	db.Create(&models.Post{Title: "Audit public blog", Slug: "audit", AuthorID: u.ID, Status: "published"})
	r = request(e, "GET", "/api/v1/blog/", "", nil)
	add("public blog returns private author data", r.Code, 200, map[string]bool{"address_visible": strings.Contains(r.Body.String(), "private address"), "phone_visible": strings.Contains(r.Body.String(), "private phone"), "email_visible": strings.Contains(r.Body.String(), u.Email)})
	db.Create(&models.Announcement{Title: "Public audit", Content: "Public", RoleTarget: "all", IsActive: true, CreatedByID: u.ID})
	db.Create(&models.Announcement{Title: "Leader only audit", Content: "Leader", RoleTarget: "leader", IsActive: true, CreatedByID: u.ID})
	r = request(e, "GET", "/api/v1/announcements", tokens["leader"], nil)
	add("leader JWT ignored on public announcements", r.Code, 200, map[string]interface{}{"leader_announcement_visible": strings.Contains(r.Body.String(), "Leader only audit"), "author_private_address_visible": strings.Contains(r.Body.String(), "private address"), "cache_control": r.Header().Get("Cache-Control")})
	r = request(e, "GET", "/api/v1/og", "", nil)
	add("OG backend route absent", r.Code, 404, nil)
	sqlDB, _, err := sqlmock.New()
	if err != nil {
		panic(err)
	}
	defer sqlDB.Close()
	pg, err := gorm.Open(postgres.New(postgres.Config{Conn: sqlDB}), &gorm.Config{DisableAutomaticPing: true, Logger: logger.Default.LogMode(logger.Silent)})
	if err != nil {
		panic(err)
	}
	stmt := pg.Session(&gorm.Session{DryRun: true}).First(&models.Event{}, "1=1").Statement
	add("Postgres dialect inserts string ID as raw condition", 0, 0, map[string]interface{}{"sql": stmt.SQL.String(), "vars": stmt.Vars, "live_database_execution": false})
	inventory := []map[string]string{}
	for _, r := range e.Routes() {
		inventory = append(inventory, map[string]string{"method": r.Method, "path": r.Path, "handler": r.Name})
	}
	unmatched := 0
	for _, c := range cases {
		if !c.Matches {
			unmatched++
		}
	}
	enc := json.NewEncoder(os.Stdout)
	enc.SetIndent("", "  ")
	enc.Encode(map[string]interface{}{"environment": "real Echo router; signed fixture JWTs; SQLite memory; external network blocked", "cases": cases, "case_count": len(cases), "unexpected_results": unmatched, "registered_routes": inventory})
	if unmatched > 0 {
		os.Exit(1)
	}
}
