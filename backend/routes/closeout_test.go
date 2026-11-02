package routes_test

import (
	"casadelrey/backend/handlers"
	"casadelrey/backend/middleware"
	"casadelrey/backend/models"
	"context"
	"encoding/json"
	"fmt"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/require"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

// Closeout regressions verify corrected behavior using isolated in-memory fixtures only.
func TestCloseout_LastAdministratorCannotDemoteSelf(t *testing.T) {
	f := newSecurityFixture(t)
	result := f.req(t, "PUT", fmt.Sprintf("/api/v1/admin/users/%d/role", f.users["admin"].ID), "admin", map[string]string{"role": "member"})
	require.Equal(t, 409, result.Code)
	var count int64
	require.NoError(t, f.db.Model(&models.User{}).Where("role = ?", "admin").Count(&count).Error)
	require.EqualValues(t, 1, count)
	require.Equal(t, 200, f.req(t, "GET", "/api/v1/admin/users", "admin", nil).Code)
}
func TestCloseout_FinancialReversalPreservesActorHistory(t *testing.T) {
	f := newSecurityFixture(t)
	d := models.Donation{Name: "Controlled", Amount: 50, Currency: "GTQ", PaymentMethod: "presencial"}
	require.NoError(t, f.db.Create(&d).Error)
	path := fmt.Sprintf("/api/v1/admin/donations/%d/cash", d.ID)
	require.Equal(t, 200, f.req(t, "PUT", path, "admin", map[string]bool{"received": true}).Code)
	require.NoError(t, f.db.First(&d, d.ID).Error)
	require.NotNil(t, d.ConfirmedByID)
	require.Equal(t, 200, f.req(t, "PUT", path, "admin", map[string]bool{"received": false}).Code)
	id := d.ID
	d = models.Donation{}
	require.NoError(t, f.db.First(&d, id).Error)
	require.Nil(t, d.ConfirmedByID)
	require.Nil(t, d.ConfirmedAt)
	var count int64
	require.NoError(t, f.db.Model(&models.ActivityLog{}).Count(&count).Error)
	require.EqualValues(t, 2, count)
}
func TestCloseout_RejectedRegistrationReleasesCapacity(t *testing.T) {
	f := newSecurityFixture(t)
	ev := models.Event{Title: "Controlled", IsActive: true, RequiresPayment: true, PriceGTQ: 50, Capacity: 1}
	require.NoError(t, f.db.Create(&ev).Error)
	r := models.PaymentReceipt{PayerName: "Controlled", PayerEmail: "controlled@example.invalid", Amount: 50, Currency: "GTQ", Purpose: "evento", EventID: &ev.ID, Status: "pendiente"}
	require.NoError(t, f.db.Create(&r).Error)
	reg := models.EventRegistration{EventID: ev.ID, Name: "Controlled", Email: "controlled@example.invalid", AttendeeCount: 1, PaymentStatus: "pendiente", ReceiptID: &r.ID}
	require.NoError(t, f.db.Create(&reg).Error)
	require.Equal(t, 200, f.req(t, "PUT", fmt.Sprintf("/api/v1/admin/receipts/%d/verify", r.ID), "admin", map[string]string{"status": "rechazado", "rejection_reason": "Controlled rejection"}).Code)
	result := f.req(t, "GET", "/api/v1/events", "", nil)
	require.Equal(t, 200, result.Code)
	var events []struct {
		IsFull bool `json:"is_full"`
		Spots  int  `json:"spots_remaining"`
	}
	require.NoError(t, json.Unmarshal(result.Body.Bytes(), &events))
	require.False(t, events[0].IsFull)
	require.Equal(t, 1, events[0].Spots)
}
func TestCloseout_ForwardedHeaderCannotChangeRateLimitIdentity(t *testing.T) {
	probe := func(change bool) int {
		e := echo.New()
		middleware.ConfigureClientIP(e)
		e.Use(middleware.AuthRateLimit())
		e.GET("/controlled", func(c echo.Context) error { return c.NoContent(200) })
		accepted := 0
		for i := 0; i < 8; i++ {
			req := httptest.NewRequest(http.MethodGet, "/controlled", nil)
			req.RemoteAddr = "192.0.2.10:1000"
			if change {
				req.Header.Set("X-Forwarded-For", fmt.Sprintf("198.51.100.%d", i+1))
			}
			rec := httptest.NewRecorder()
			e.ServeHTTP(rec, req)
			if rec.Code == 200 {
				accepted++
			}
		}
		return accepted
	}
	require.Equal(t, 5, probe(false))
	require.Equal(t, 5, probe(true))
}
func TestCloseout_PastEventRejectsRegistrationByAPI(t *testing.T) {
	f := newSecurityFixture(t)
	ev := models.Event{Title: "Controlled past event", Date: "2000-01-01", IsActive: true}
	require.NoError(t, f.db.Create(&ev).Error)
	result := f.req(t, "POST", fmt.Sprintf("/api/v1/events/%d/rsvp", ev.ID), "", map[string]interface{}{"name": "Controlled", "email": "controlled@example.invalid", "attendee_count": 1})
	require.Equal(t, 400, result.Code)
}
func TestCloseout_AdminCannotSaveInvalidPaidEvent(t *testing.T) {
	f := newSecurityFixture(t)
	result := f.req(t, "POST", "/api/v1/admin/events/", "admin", map[string]interface{}{"title": "Controlled invalid event", "date": "not-a-date", "requires_payment": true, "price_gtq": -1, "capacity": -1, "payment_deadline": "not-a-date"})
	require.Equal(t, 400, result.Code)
}

func TestCloseout_LogoutRevokesRefreshAndAccess(t *testing.T) {
	f := newSecurityFixture(t)
	login := f.req(t, "POST", "/api/v1/auth/login", "", map[string]string{"email": f.users["admin"].Email, "password": "InitialPassword123!"})
	require.Equal(t, 200, login.Code)
	var session struct {
		Token        string `json:"token"`
		RefreshToken string `json:"refresh_token"`
	}
	require.NoError(t, json.Unmarshal(login.Body.Bytes(), &session))
	require.Equal(t, 204, f.req(t, "POST", "/api/v1/auth/logout", "", map[string]string{"refresh_token": session.RefreshToken}).Code)
	require.Equal(t, 401, f.req(t, "POST", "/api/v1/auth/refresh", "", map[string]string{"refresh_token": session.RefreshToken}).Code)
	require.Equal(t, 401, f.req(t, "GET", "/api/v1/admin/users", "", nil, map[string]string{"Authorization": "Bearer " + session.Token}).Code)
	require.Equal(t, 204, f.req(t, "POST", "/api/v1/auth/logout", "", map[string]string{"refresh_token": session.RefreshToken}).Code)
}

func TestCloseout_ExpiredReservationCannotOversellOnApproval(t *testing.T) {
	f := newSecurityFixture(t)
	ev := models.Event{Title: "Controlled event", Date: "2099-12-01", IsActive: true, RequiresPayment: true, PriceGTQ: 50, Capacity: 1}
	require.NoError(t, f.db.Create(&ev).Error)
	r := models.PaymentReceipt{PayerName: "Controlled", PayerEmail: "first@example.invalid", Amount: 50, Currency: "GTQ", Purpose: "evento", EventID: &ev.ID, Status: "pendiente"}
	require.NoError(t, f.db.Create(&r).Error)
	expiry := time.Now().Add(-time.Minute)
	old := models.EventRegistration{EventID: ev.ID, Name: "First", Email: "first@example.invalid", AttendeeCount: 1, PaymentStatus: "pendiente", ReceiptID: &r.ID, ReservationExpiresAt: &expiry}
	require.NoError(t, f.db.Create(&old).Error)
	newer := models.EventRegistration{EventID: ev.ID, Name: "Second", Email: "second@example.invalid", AttendeeCount: 1, PaymentStatus: "verificado"}
	require.NoError(t, f.db.Create(&newer).Error)
	result := f.req(t, "PUT", fmt.Sprintf("/api/v1/admin/receipts/%d/verify", r.ID), "admin", map[string]string{"status": "verificado"})
	require.Equal(t, 409, result.Code)
	var unchanged models.PaymentReceipt
	require.NoError(t, f.db.First(&unchanged, r.ID).Error)
	require.Equal(t, "pendiente", unchanged.Status)
	require.NoError(t, f.db.Delete(&newer).Error)
	require.Equal(t, 200, f.req(t, "PUT", fmt.Sprintf("/api/v1/admin/receipts/%d/verify", r.ID), "admin", map[string]string{"status": "verificado"}).Code)
}

type cleanupStore struct {
	*regressionStorage
	deleted []string
}

func (s *cleanupStore) DeleteReceipt(_ context.Context, ref string) error {
	s.deleted = append(s.deleted, ref)
	return nil
}

func TestCloseout_CleanupPreservesClaimedHistoricalAndActiveFiles(t *testing.T) {
	f := newSecurityFixture(t)
	store := &cleanupStore{regressionStorage: f.store}
	refs := []string{"receipt-private:01234567-89ab-4cde-8012-3456789abcde.png", "receipt-private:11234567-89ab-4cde-8012-3456789abcde.png", "receipt-private:21234567-89ab-4cde-8012-3456789abcde.png", "receipt-private:31234567-89ab-4cde-8012-3456789abcde.png"}
	for i, ref := range refs {
		status := "staged"
		if i == 1 {
			status = "claimed"
		}
		expires := time.Now().Add(-time.Hour)
		if i == 3 {
			expires = time.Now().Add(time.Hour)
		}
		require.NoError(t, f.db.Create(&models.ReceiptUpload{Reference: ref, Status: status, Size: 10, ExpiresAt: expires}).Error)
	}
	receipt := models.PaymentReceipt{PayerName: "Historical", Amount: 10, ReceiptImageURL: refs[2]}
	require.NoError(t, f.db.Create(&receipt).Error)
	require.NoError(t, f.db.Delete(&receipt).Error)
	require.NoError(t, handlers.CleanupOrphanReceipts(context.Background(), f.db, store))
	require.Equal(t, []string{refs[0]}, store.deleted)
}

func TestCloseout_FinancialHistoryFailureRollsBackDecision(t *testing.T) {
	f := newSecurityFixture(t)
	d := models.Donation{Name: "Controlled", Amount: 50, Currency: "GTQ", PaymentMethod: "presencial"}
	require.NoError(t, f.db.Create(&d).Error)
	require.NoError(t, f.db.Exec(`CREATE TRIGGER fail_decision BEFORE INSERT ON activity_logs BEGIN SELECT RAISE(FAIL, 'simulated audit failure'); END`).Error)
	response := f.req(t, "PUT", fmt.Sprintf("/api/v1/admin/donations/%d/cash", d.ID), "admin", map[string]bool{"received": true})
	require.Equal(t, 500, response.Code)
	var saved models.Donation
	require.NoError(t, f.db.First(&saved, d.ID).Error)
	require.Nil(t, saved.ConfirmedAt)
	var count int64
	require.NoError(t, f.db.Model(&models.EmailMessage{}).Count(&count).Error)
	require.Zero(t, count)
}

func TestCloseout_GalleryAlbumRetriesDoNotDuplicate(t *testing.T) {
	f := newSecurityFixture(t)
	body := map[string]interface{}{"album": "Comunidad", "title": "Encuentro", "url": "https://media.example.invalid/group.jpg", "is_active": true}
	headers := map[string]string{"Idempotency-Key": "controlled-photo-001"}
	first := f.req(t, "POST", "/api/v1/admin/gallery/", "admin", body, headers)
	require.Equal(t, 201, first.Code, first.Body.String())
	require.Equal(t, 200, f.req(t, "POST", "/api/v1/admin/gallery/", "admin", body, headers).Code)
	body["album"] = "Otro álbum"
	require.Equal(t, 409, f.req(t, "POST", "/api/v1/admin/gallery/", "admin", body, headers).Code)
	var count int64
	require.NoError(t, f.db.Model(&models.GalleryPhoto{}).Count(&count).Error)
	require.EqualValues(t, 1, count)
	albums := f.req(t, "GET", "/api/v1/admin/gallery/albums", "admin", nil)
	require.Equal(t, 200, albums.Code)
	require.JSONEq(t, `["Comunidad"]`, albums.Body.String())
}

func TestCloseout_ExpiredStagedUploadCannotBecomeDonation(t *testing.T) {
	f := newSecurityFixture(t)
	ref := "receipt-private:01234567-89ab-4cde-8012-3456789abcde.png"
	require.NoError(t, f.db.Create(&models.ReceiptUpload{Reference: ref, Status: "staged", ExpiresAt: time.Now().Add(-time.Minute), Size: 10}).Error)
	body := map[string]interface{}{"name": "Controlled", "email": "controlled@example.invalid", "amount": 100, "currency": "GTQ", "payment_method": "transferencia", "receipt": map[string]string{"receipt_image_url": ref}}
	result := f.req(t, "POST", "/api/v1/donations/register", "", body, map[string]string{"Idempotency-Key": "controlled-expired-upload"})
	require.Equal(t, 400, result.Code, result.Body.String())
	var count int64
	require.NoError(t, f.db.Model(&models.Donation{}).Count(&count).Error)
	require.Zero(t, count)
}

func TestCloseout_OnlyAdministratorsSeeUnpublishedEvents(t *testing.T) {
	f := newSecurityFixture(t)
	event := models.Event{Title: "Unpublished", Date: "2099-12-01"}
	require.NoError(t, f.db.Create(&event).Error)
	require.NoError(t, f.db.Model(&event).Update("is_active", false).Error)
	public := f.req(t, "GET", "/api/v1/events", "", nil)
	require.JSONEq(t, `[]`, public.Body.String())
	require.Equal(t, 401, f.req(t, "GET", "/api/v1/admin/events", "", nil).Code)
	require.Equal(t, 403, f.req(t, "GET", "/api/v1/admin/events", "member", nil).Code)
	admin := f.req(t, "GET", "/api/v1/admin/events", "admin", nil)
	require.Equal(t, 200, admin.Code)
	require.Contains(t, admin.Body.String(), "Unpublished")
}
