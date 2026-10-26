package routes_test

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"image"
	"image/png"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"
	"time"

	"casadelrey/backend/auth"
	"casadelrey/backend/config"
	"casadelrey/backend/models"
	"casadelrey/backend/routes"
	"casadelrey/backend/storage"
	"github.com/glebarez/sqlite"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type regressionStorage struct {
	folder       string
	receiptReads int
}

func (s *regressionStorage) Upload(_ context.Context, folder, filename string, _ io.Reader, _ int64, _ string) (string, error) {
	s.folder = folder
	return "https://example.invalid/" + folder + "/" + filename, nil
}
func (*regressionStorage) Delete(context.Context, string) error { return nil }
func (*regressionStorage) ActiveBackend() storage.Backend       { return storage.Backend("test-memory") }
func (s *regressionStorage) UploadReceipt(_ context.Context, filename string, _ io.Reader, _ int64, _ string) (string, error) {
	s.folder = "comprobantes"
	return storage.ReceiptReference(filename), nil
}
func (s *regressionStorage) OpenReceipt(_ context.Context, _ string) (io.ReadCloser, string, error) {
	s.receiptReads++
	return io.NopCloser(bytes.NewReader([]byte("private receipt fixture"))), "image/png", nil
}

func TestSecurityRegression_ReceiptFileRequiresLiveAdmin(t *testing.T) {
	f := newSecurityFixture(t)
	receipt := models.PaymentReceipt{PayerName: "Guest", Amount: 100, ReceiptImageURL: "receipt-private:01234567-89ab-4cde-8012-3456789abcde.png"}
	require.NoError(t, f.db.Create(&receipt).Error)
	path := fmt.Sprintf("/api/v1/admin/receipts/%d/file", receipt.ID)
	assertStatus(t, f.req(t, "GET", path, "", nil), 401)
	for _, role := range []string{"member", "leader", "volunteer"} {
		assertStatus(t, f.req(t, "GET", path, role, nil), 403)
	}
	require.Zero(t, f.store.receiptReads)
	r := f.req(t, "GET", path, "admin", nil)
	assertStatus(t, r, 200)
	require.Equal(t, "private receipt fixture", r.Body.String())
	require.Equal(t, "private, no-store", r.Header().Get("Cache-Control"))
	require.Equal(t, "nosniff", r.Header().Get("X-Content-Type-Options"))
	require.Equal(t, "image/png", r.Header().Get("Content-Type"))
	require.Equal(t, 1, f.store.receiptReads)
	assertStatus(t, f.req(t, "GET", "/api/v1/admin/receipts/9999/file", "admin", nil), 404)
	// Historical external URLs must never be fetched or rendered by the API.
	require.NoError(t, f.db.Model(&receipt).Update("receipt_image_url", "http://127.0.0.1:1/internal").Error)
	assertStatus(t, f.req(t, "GET", path, "admin", nil), 409)
	require.Equal(t, 1, f.store.receiptReads)
	require.NoError(t, f.db.Model(&models.User{}).Where("id = ?", f.users["admin"].ID).Update("session_version", 1).Error)
	assertStatus(t, f.req(t, "GET", path, "admin", nil), 401)
}

func TestSecurityRegression_ReceiptReferencesAndLegacyStaticBlocked(t *testing.T) {
	f := newSecurityFixture(t)
	for _, ref := range []string{"https://example.invalid/receipt.png", "receipt-private:../../outside.png", "receipt-private:01234567-89ab-4cde-8012-3456789abcde.png?token=x"} {
		body := map[string]interface{}{"payer_name": "Guest", "amount": 100, "receipt_image_url": ref}
		assertStatus(t, f.req(t, "POST", "/api/v1/receipts", "", body), 400)
	}
	for _, path := range []string{"/uploads/comprobantes/old.png", "/uploads/comprobantes", "/uploads/comprobantes%2Fold.png", "/uploads/general/../comprobantes/old.png", "/uploads/%2563omprobantes/old.png"} {
		r := f.req(t, "GET", path, "admin", nil)
		assertStatus(t, r, 404)
		require.Equal(t, "private, no-store", r.Header().Get("Cache-Control"), path)
	}
}

type securityFixture struct {
	e      *echo.Echo
	db     *gorm.DB
	tokens map[string]string
	users  map[string]models.User
	store  *regressionStorage
	seq    int
}

func newSecurityFixture(t *testing.T) *securityFixture {
	t.Helper()
	cfg := &config.Config{JWTSecret: "regression-secret-only", ClientURL: "https://example.invalid"}
	prev := config.AppConfig
	config.AppConfig = cfg
	t.Cleanup(func() { config.AppConfig = prev })
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{Logger: logger.Default.LogMode(logger.Silent)})
	require.NoError(t, err)
	sqlDB, err := db.DB()
	require.NoError(t, err)
	sqlDB.SetMaxOpenConns(1)
	t.Cleanup(func() { sqlDB.Close() })
	require.NoError(t, db.AutoMigrate(&models.User{}, &models.Cell{}, &models.Post{}, &models.Announcement{}, &models.GalleryPhoto{}, &models.SocialPost{}, &models.FAQ{}, &models.CellCategory{}, &models.CellReport{}, &models.VolunteerReport{}, &models.MemberBoleta{}, &models.Event{}, &models.EventRegistration{}, &models.PaymentReceipt{}, &models.Donation{}, &models.DonationPurpose{}, &models.Leader{}, &models.Volunteer{}, &models.VolunteerArea{}, &models.Petition{}, &models.ConnectCard{}, &models.HeroSetting{}, &models.SitePhoto{}, &models.SiteSetting{}, &models.UserGoal{}, &models.ActivityLog{}))
	f := &securityFixture{e: echo.New(), db: db, tokens: map[string]string{}, users: map[string]models.User{}, store: &regressionStorage{}}
	hash, err := auth.HashPassword("InitialPassword123!")
	require.NoError(t, err)
	for _, role := range []string{"admin", "leader", "volunteer", "member"} {
		u := models.User{Name: "Fixture " + role, Email: role + "@example.invalid", Password: hash, Role: role, EmailVerified: true, Address: "PRIVATE_ADDRESS", Phone: "PRIVATE_PHONE"}
		require.NoError(t, db.Create(&u).Error)
		f.users[role] = u
		f.tokens[role], err = auth.GenerateJWT(u.ID, u.Name, u.Email, u.Role, u.SessionVersion)
		require.NoError(t, err)
	}
	routes.Register(f.e, db, cfg, f.store)
	return f
}
func (f *securityFixture) req(t *testing.T, method, path, role string, body interface{}, headers ...map[string]string) *httptest.ResponseRecorder {
	t.Helper()
	var reader io.Reader
	if body != nil {
		data, err := json.Marshal(body)
		require.NoError(t, err)
		reader = bytes.NewReader(data)
	}
	req := httptest.NewRequest(method, path, reader)
	req.Header.Set("Content-Type", "application/json")
	if path == "/api/v1/donations/register" && len(headers) == 0 {
		req.Header.Set("Idempotency-Key", fmt.Sprintf("fixture-donation-%016d", f.seq+1))
	}
	for _, values := range headers {
		for name, value := range values {
			req.Header.Set(name, value)
		}
	}
	if token := f.tokens[role]; token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	f.seq++
	req.RemoteAddr = fmt.Sprintf("192.0.2.%d:12000", f.seq)
	rec := httptest.NewRecorder()
	f.e.ServeHTTP(rec, req)
	return rec
}

func TestSecurityRegression_DonationIdempotentRetries(t *testing.T) {
	f := newSecurityFixture(t)
	body := map[string]interface{}{"name": "Donor", "amount": 100, "currency": "GTQ", "payment_method": "transferencia", "receipt": map[string]string{"receipt_image_url": "receipt-private:01234567-89ab-4cde-8012-3456789abcde.png"}}
	headers := map[string]string{"Idempotency-Key": "donation-retry-fixture-001"}
	path := "/api/v1/donations/register"
	first := f.req(t, "POST", path, "", body, headers)
	assertStatus(t, first, 201)
	second := f.req(t, "POST", path, "", body, headers)
	assertStatus(t, second, 200)
	require.JSONEq(t, first.Body.String(), second.Body.String())
	body["amount"] = 200
	assertStatus(t, f.req(t, "POST", path, "", body, headers), 409)
	assertStatus(t, f.req(t, "POST", path, "", body, map[string]string{"Idempotency-Key": "short"}), 400)
	assertStatus(t, f.req(t, "POST", path, "", body, map[string]string{}), 400)
	for _, model := range []interface{}{&models.Donation{}, &models.PaymentReceipt{}} {
		var count int64
		require.NoError(t, f.db.Model(model).Count(&count).Error)
		require.EqualValues(t, 1, count)
	}
	// A deliberate second donation gets its own key, even with identical data.
	body["amount"] = 100
	assertStatus(t, f.req(t, "POST", path, "", body, map[string]string{"Idempotency-Key": "donation-retry-fixture-002"}), 201)
	var donation models.Donation
	require.NoError(t, f.db.First(&donation).Error)
	require.NoError(t, f.db.Delete(&donation).Error)
	assertStatus(t, f.req(t, "POST", path, "", body, headers), 409)
}

func TestSecurityRegression_DonationIdempotencyRollbackAndConcurrentRequests(t *testing.T) {
	f := newSecurityFixture(t)
	body := map[string]interface{}{"name": "Donor", "amount": 100, "currency": "GTQ", "payment_method": "transferencia", "receipt": map[string]string{"receipt_image_url": "receipt-private:01234567-89ab-4cde-8012-3456789abcde.png"}}
	headers := map[string]string{"Idempotency-Key": "donation-concurrent-fixture"}
	path := "/api/v1/donations/register"
	require.NoError(t, f.db.Exec(`CREATE TRIGGER fail_receipt_insert BEFORE INSERT ON payment_receipts BEGIN SELECT RAISE(FAIL, 'simulated failure'); END`).Error)
	assertStatus(t, f.req(t, "POST", path, "", body, headers), 500)
	var count int64
	require.NoError(t, f.db.Model(&models.Donation{}).Count(&count).Error)
	require.Zero(t, count)
	require.NoError(t, f.db.Exec(`DROP TRIGGER fail_receipt_insert`).Error)
	data, err := json.Marshal(body)
	require.NoError(t, err)
	responses := make([]*httptest.ResponseRecorder, 8)
	var wg sync.WaitGroup
	for i := range responses {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			req := httptest.NewRequest("POST", path, bytes.NewReader(data))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Idempotency-Key", headers["Idempotency-Key"])
			req.RemoteAddr = fmt.Sprintf("203.0.113.%d:10000", i+1)
			responses[i] = httptest.NewRecorder()
			f.e.ServeHTTP(responses[i], req)
		}(i)
	}
	wg.Wait()
	created := 0
	for _, response := range responses {
		if response.Code == 201 {
			created++
		} else {
			assertStatus(t, response, 200)
		}
		require.JSONEq(t, responses[0].Body.String(), response.Body.String())
	}
	require.Equal(t, 1, created)
	for _, model := range []interface{}{&models.Donation{}, &models.PaymentReceipt{}} {
		require.NoError(t, f.db.Model(model).Count(&count).Error)
		require.EqualValues(t, 1, count)
	}
}
func assertStatus(t *testing.T, r *httptest.ResponseRecorder, want int) {
	t.Helper()
	require.Equal(t, want, r.Code, r.Body.String())
}
func TestSecurityRegression_PublicIDsAndAuthorPrivacy(t *testing.T) {
	f := newSecurityFixture(t)
	event := models.Event{Title: "Fixture", IsActive: true}
	require.NoError(t, f.db.Create(&event).Error)
	for _, id := range []string{"1=1", "1=0", "-1", "0", "invalid"} {
		t.Run("id="+id, func(t *testing.T) {
			assertStatus(t, f.req(t, "POST", "/api/v1/events/"+id+"/rsvp", "", map[string]interface{}{"name": "Guest", "email": "guest@example.invalid"}), 400)
		})
	}
	var count int64
	require.NoError(t, f.db.Model(&models.EventRegistration{}).Count(&count).Error)
	require.Zero(t, count)
	post := models.Post{Title: "Post", Slug: "privacy", Content: "Hello", Status: "published", AuthorID: f.users["admin"].ID}
	require.NoError(t, f.db.Create(&post).Error)
	ann := models.Announcement{Title: "Announcement", Content: "Hello", RoleTarget: "all", IsActive: true, CreatedByID: f.users["admin"].ID}
	require.NoError(t, f.db.Create(&ann).Error)
	for _, path := range []string{"/api/v1/blog/", "/api/v1/blog/privacy", "/api/v1/announcements"} {
		r := f.req(t, "GET", path, "", nil)
		assertStatus(t, r, 200)
		require.NotContains(t, r.Body.String(), "PRIVATE_")
		require.NotContains(t, r.Body.String(), "admin@example.invalid")
		var data interface{}
		require.NoError(t, json.Unmarshal(r.Body.Bytes(), &data))
		var item map[string]interface{}
		if arr, ok := data.([]interface{}); ok {
			require.NotEmpty(t, arr)
			item = arr[0].(map[string]interface{})
		} else {
			item = data.(map[string]interface{})
		}
		author := item["author"].(map[string]interface{})
		require.Len(t, author, 2)
		require.Equal(t, "Fixture admin", author["name"])
	}
}
func TestSecurityRegression_RoleAndDeletedAccountInvalidateJWT(t *testing.T) {
	f := newSecurityFixture(t)
	u := f.users["admin"]
	assertStatus(t, f.req(t, "PUT", fmt.Sprintf("/api/v1/admin/users/%d/role", u.ID), "admin", map[string]string{"role": "member"}), 200)
	assertStatus(t, f.req(t, "GET", "/api/v1/admin/kpis", "admin", nil), 401)
	member := f.users["member"]
	require.NoError(t, f.db.Delete(&member).Error)
	assertStatus(t, f.req(t, "GET", "/api/v1/profile/goals", "member", nil), 401)
}
func TestSecurityRegression_ResetRevokesSessionsAndRefreshIsSingleUse(t *testing.T) {
	f := newSecurityFixture(t)
	u := f.users["member"]
	expiry := time.Now().Add(time.Hour)
	require.NoError(t, f.db.Model(&u).Updates(map[string]interface{}{"reset_token": "reset-fixture", "reset_token_expiry": expiry, "refresh_token": "old-refresh", "refresh_token_expiry": expiry}).Error)
	reset := map[string]string{"token": "reset-fixture", "newPassword": "NewPassword123!"}
	assertStatus(t, f.req(t, "POST", "/api/v1/auth/reset-password", "", reset), 200)
	assertStatus(t, f.req(t, "GET", "/api/v1/profile/goals", "member", nil), 401)
	assertStatus(t, f.req(t, "POST", "/api/v1/auth/refresh", "", map[string]string{"refresh_token": "old-refresh"}), 401)
	assertStatus(t, f.req(t, "POST", "/api/v1/auth/reset-password", "", reset), 400)
	login := f.req(t, "POST", "/api/v1/auth/login", "", map[string]string{"email": u.Email, "password": "NewPassword123!"})
	assertStatus(t, login, 200)
	var session struct {
		Token   string `json:"token"`
		Refresh string `json:"refresh_token"`
	}
	require.NoError(t, json.Unmarshal(login.Body.Bytes(), &session))
	f.tokens["member"] = session.Token
	assertStatus(t, f.req(t, "GET", "/api/v1/profile/goals", "member", nil), 200)
	require.NoError(t, f.db.First(&u, u.ID).Error)
	require.NotNil(t, u.RefreshToken)
	require.Equal(t, auth.HashToken(session.Refresh), *u.RefreshToken)
	assertStatus(t, f.req(t, "POST", "/api/v1/auth/refresh", "", map[string]string{"refresh_token": *u.RefreshToken}), 401)
	assertStatus(t, f.req(t, "POST", "/api/v1/auth/refresh", "", map[string]string{"refresh_token": session.Refresh}), 200)
	assertStatus(t, f.req(t, "POST", "/api/v1/auth/refresh", "", map[string]string{"refresh_token": session.Refresh}), 401)
}
func TestSecurityRegression_ChangePasswordRevokesJWT(t *testing.T) {
	f := newSecurityFixture(t)
	assertStatus(t, f.req(t, "PUT", "/api/v1/profile/password", "member", map[string]string{"current_password": "InitialPassword123!", "new_password": "NewPassword123!"}), 200)
	assertStatus(t, f.req(t, "GET", "/api/v1/profile/goals", "member", nil), 401)
}
func TestSecurityRegression_VolunteerSelfServiceAndAdminApproval(t *testing.T) {
	f := newSecurityFixture(t)
	body := map[string]interface{}{"volunteer_name": "Fixture volunteer", "area": "Welcome", "service_date": "2026-10-03", "volunteer_id": f.users["admin"].ID}
	assertStatus(t, f.req(t, "POST", "/api/v1/volunteer/reports", "member", body), 403)
	assertStatus(t, f.req(t, "POST", "/api/v1/volunteer/reports", "volunteer", body), 201)
	var report models.VolunteerReport
	require.NoError(t, f.db.First(&report).Error)
	require.NotNil(t, report.VolunteerID)
	require.Equal(t, f.users["volunteer"].ID, *report.VolunteerID)
	r := f.req(t, "GET", "/api/v1/volunteer/reports", "leader", nil)
	assertStatus(t, r, 200)
	require.NotContains(t, r.Body.String(), "Fixture volunteer")
	path := fmt.Sprintf("/api/v1/admin/volunteer-reports/%d/approve", report.ID)
	assertStatus(t, f.req(t, "PUT", path, "leader", map[string]string{"status": "aprobado"}), 403)
	assertStatus(t, f.req(t, "PUT", path, "admin", map[string]string{"status": "aprobado"}), 200)
}
func TestSecurityRegression_ReceiptAmountCurrencyAndReuse(t *testing.T) {
	for _, tc := range []struct {
		name              string
		amount            float64
		currency, purpose string
		used              bool
		want              int
	}{
		{"insufficient", 1, "GTQ", "evento", false, 402}, {"wrong_currency", 500, "USD", "evento", false, 402}, {"wrong_purpose", 500, "GTQ", "donacion", false, 402}, {"reused", 500, "GTQ", "evento", true, 409}, {"valid", 500, "GTQ", "evento", false, 201},
	} {
		t.Run(tc.name, func(t *testing.T) {
			f := newSecurityFixture(t)
			ev := models.Event{Title: "Paid", RequiresPayment: true, PriceGTQ: 100, IsActive: true, Capacity: 10}
			require.NoError(t, f.db.Create(&ev).Error)
			receipt := models.PaymentReceipt{PayerName: "Guest", PayerEmail: "payer@example.invalid", Amount: tc.amount, Currency: tc.currency, Purpose: tc.purpose, EventID: &ev.ID, Status: "verificado"}
			require.NoError(t, f.db.Create(&receipt).Error)
			if tc.used {
				require.NoError(t, f.db.Create(&models.EventRegistration{EventID: ev.ID, Name: "Other", Email: "other@example.invalid", AttendeeCount: 1, ReceiptID: &receipt.ID}).Error)
			}
			r := f.req(t, "POST", fmt.Sprintf("/api/v1/events/%d/rsvp", ev.ID), "", map[string]interface{}{"name": "Guest", "email": receipt.PayerEmail, "attendee_count": 5})
			assertStatus(t, r, tc.want)
			var n int64
			require.NoError(t, f.db.Model(&models.EventRegistration{}).Where("email = ?", receipt.PayerEmail).Count(&n).Error)
			if tc.want == 201 {
				require.EqualValues(t, 1, n)
			} else {
				require.Zero(t, n)
			}
		})
	}
}
func TestSecurityRegression_DonationReceiptAtomicVerificationAndRollback(t *testing.T) {
	for _, failure := range []bool{false, true} {
		t.Run(fmt.Sprintf("failure=%v", failure), func(t *testing.T) {
			f := newSecurityFixture(t)
			body := map[string]interface{}{"name": "Donor", "amount": 100, "currency": "GTQ", "payment_method": "transferencia", "receipt": map[string]string{"receipt_image_url": "receipt-private:01234567-89ab-4cde-8012-3456789abcde.png", "bank_name": "Test"}}
			assertStatus(t, f.req(t, "POST", "/api/v1/donations/register", "", body), 201)
			var d models.Donation
			require.NoError(t, f.db.First(&d).Error)
			require.False(t, d.IsSuccessful)
			require.NotNil(t, d.ReceiptID)
			var receipt models.PaymentReceipt
			require.NoError(t, f.db.First(&receipt, *d.ReceiptID).Error)
			require.NotNil(t, receipt.DonationID)
			require.Equal(t, d.ID, *receipt.DonationID)
			if failure {
				require.NoError(t, f.db.Exec(`CREATE TRIGGER fail_receipt BEFORE UPDATE ON payment_receipts BEGIN SELECT RAISE(FAIL, 'simulated failure'); END`).Error)
			}
			path := fmt.Sprintf("/api/v1/admin/receipts/%d/verify", receipt.ID)
			r := f.req(t, "PUT", path, "admin", map[string]string{"status": "verificado"})
			if failure {
				assertStatus(t, r, 500)
			} else {
				assertStatus(t, r, 200)
			}
			require.NoError(t, f.db.First(&d, d.ID).Error)
			require.Equal(t, !failure, d.IsSuccessful)
			require.NoError(t, f.db.First(&receipt, receipt.ID).Error)
			if failure {
				require.Equal(t, "pendiente", receipt.Status)
			} else {
				require.Equal(t, "verificado", receipt.Status)
				assertStatus(t, f.req(t, "PUT", fmt.Sprintf("/api/v1/admin/receipts/%d/revert", receipt.ID), "admin", nil), 200)
				require.NoError(t, f.db.First(&d, d.ID).Error)
				require.False(t, d.IsSuccessful)
			}
		})
	}
	f := newSecurityFixture(t)
	assertStatus(t, f.req(t, "POST", "/api/v1/donations/register", "", map[string]interface{}{"name": "Donor", "amount": 100, "currency": "USD"}), 400)
}
func TestSecurityRegression_CancellationRequiresValidSingleUseCredential(t *testing.T) {
	f := newSecurityFixture(t)
	expires := time.Now().Add(15 * time.Minute)
	ev := models.Event{Title: "Test", IsActive: true}
	require.NoError(t, f.db.Create(&ev).Error)
	reg := models.EventRegistration{EventID: ev.ID, Name: "Guest", Email: "guest@example.invalid", AttendeeCount: 1, CancellationTokenHash: auth.HashToken("secret-fixture"), CancellationTokenExpiry: &expires}
	require.NoError(t, f.db.Create(&reg).Error)
	path := fmt.Sprintf("/api/v1/events/%d/rsvp", ev.ID)
	assertStatus(t, f.req(t, "DELETE", path+"?email="+reg.Email, "", nil), 403)
	assertStatus(t, f.req(t, "DELETE", path, "", map[string]string{"email": reg.Email, "token": "wrong"}), 403)
	var count int64
	require.NoError(t, f.db.Model(&models.EventRegistration{}).Count(&count).Error)
	require.EqualValues(t, 1, count)
	body := map[string]string{"email": reg.Email, "token": "secret-fixture"}
	assertStatus(t, f.req(t, "DELETE", path, "", body), 200)
	assertStatus(t, f.req(t, "DELETE", path, "", body), 403)
}
func TestSecurityRegression_VolunteerUploadDestinationAndFakeImage(t *testing.T) {
	f := newSecurityFixture(t)
	var imageData bytes.Buffer
	require.NoError(t, png.Encode(&imageData, image.NewRGBA(image.Rect(0, 0, 2, 2))))
	for _, tc := range []struct {
		name string
		data []byte
		want int
	}{{"photo.png", imageData.Bytes(), 201}, {"fake.jpg", []byte("plain text"), 400}} {
		var b bytes.Buffer
		w := multipart.NewWriter(&b)
		part, err := w.CreateFormFile("file", tc.name)
		require.NoError(t, err)
		_, err = part.Write(tc.data)
		require.NoError(t, err)
		require.NoError(t, w.Close())
		q := httptest.NewRequest(http.MethodPost, "/api/v1/volunteer/reports/upload?folder=hero", &b)
		q.Header.Set("Content-Type", w.FormDataContentType())
		q.Header.Set("Authorization", "Bearer "+f.tokens["volunteer"])
		q.RemoteAddr = "198.51.100.5:10000"
		r := httptest.NewRecorder()
		f.e.ServeHTTP(r, q)
		assertStatus(t, r, tc.want)
	}
	require.Equal(t, "reportes-voluntarios", f.store.folder)
	assertStatus(t, f.req(t, "POST", "/api/v1/upload", "volunteer", nil), 403)
}
