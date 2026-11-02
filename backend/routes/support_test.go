package routes_test

import (
	"bytes"
	"casadelrey/backend/auth"
	"casadelrey/backend/models"
	"encoding/json"
	"fmt"
	"github.com/stretchr/testify/require"
	"image"
	"image/png"
	"mime/multipart"
	"net/http/httptest"
	"testing"
	"time"
)

func createSupport(t *testing.T, f *securityFixture) models.SupportTicket {
	t.Helper()
	body := map[string]string{"subject": "No puedo guardar el reporte", "module": "celulas", "body": "Al guardar el reporte aparece un error y los cambios no se reflejan."}
	response := f.req(t, "POST", "/api/v1/support/tickets", "leader", body, map[string]string{"Idempotency-Key": "controlled-support-new"})
	require.Equal(t, 201, response.Code, response.Body.String())
	var ticket models.SupportTicket
	require.NoError(t, json.Unmarshal(response.Body.Bytes(), &ticket))
	return ticket
}
func otherSupportLeader(t *testing.T, f *securityFixture) {
	t.Helper()
	user := models.User{Name: "Other leader", Email: "other@example.invalid", Role: "leader", Password: "unused"}
	require.NoError(t, f.db.Create(&user).Error)
	f.users["other"] = user
	token, err := auth.GenerateJWT(user.ID, user.Name, user.Email, user.Role, 0)
	require.NoError(t, err)
	f.tokens["other"] = token
}
func supportUpload(t *testing.T, f *securityFixture, ticket uint, role, key string, data []byte) *httptest.ResponseRecorder {
	t.Helper()
	var body bytes.Buffer
	form := multipart.NewWriter(&body)
	part, err := form.CreateFormFile("file", "captura.png")
	require.NoError(t, err)
	_, err = part.Write(data)
	require.NoError(t, err)
	require.NoError(t, form.Close())
	request := httptest.NewRequest("POST", fmt.Sprintf("/api/v1/support/tickets/%d/attachments", ticket), &body)
	request.Header.Set("Content-Type", form.FormDataContentType())
	request.Header.Set("Idempotency-Key", key)
	if f.tokens[role] != "" {
		request.Header.Set("Authorization", "Bearer "+f.tokens[role])
	}
	request.RemoteAddr = "192.0.2.65:1000"
	response := httptest.NewRecorder()
	f.e.ServeHTTP(response, request)
	return response
}
func supportPNG(t *testing.T) []byte {
	t.Helper()
	var imageData bytes.Buffer
	require.NoError(t, png.Encode(&imageData, image.NewRGBA(image.Rect(0, 0, 2, 2))))
	return imageData.Bytes()
}
func TestSupportPrivateScopeAndIdempotentCreation(t *testing.T) {
	f := newSecurityFixture(t)
	ticket := createSupport(t, f)
	otherSupportLeader(t, f)
	body := map[string]string{"subject": ticket.Subject, "module": ticket.Module, "body": "Al guardar el reporte aparece un error y los cambios no se reflejan."}
	retry := f.req(t, "POST", "/api/v1/support/tickets", "leader", body, map[string]string{"Idempotency-Key": "controlled-support-new"})
	require.Equal(t, 200, retry.Code)
	body["subject"] = "Otro asunto diferente"
	require.Equal(t, 409, f.req(t, "POST", "/api/v1/support/tickets", "leader", body, map[string]string{"Idempotency-Key": "controlled-support-new"}).Code)
	var count int64
	require.NoError(t, f.db.Model(&models.SupportTicket{}).Count(&count).Error)
	require.EqualValues(t, 1, count)
	for _, role := range []string{"", "member", "volunteer"} {
		expected := 403
		if role == "" {
			expected = 401
		}
		for _, path := range []string{"/api/v1/support/options", "/api/v1/support/tickets", fmt.Sprintf("/api/v1/support/tickets/%d", ticket.ID)} {
			require.Equal(t, expected, f.req(t, "GET", path, role, nil).Code)
		}
	}
	own := f.req(t, "GET", "/api/v1/support/tickets", "leader", nil)
	require.Equal(t, 200, own.Code)
	require.Contains(t, own.Body.String(), ticket.Subject)
	require.Equal(t, "private, no-store", own.Header().Get("Cache-Control"))
	require.NotContains(t, own.Body.String(), "submission_key")
	other := f.req(t, "GET", "/api/v1/support/tickets", "other", nil)
	require.NotContains(t, other.Body.String(), ticket.Subject)
	path := fmt.Sprintf("/api/v1/support/tickets/%d", ticket.ID)
	require.Equal(t, 404, f.req(t, "GET", path, "other", nil).Code)
	require.Equal(t, 404, f.req(t, "POST", path+"/messages", "other", map[string]string{"body": "Intento ajeno"}, map[string]string{"Idempotency-Key": "controlled-other-reply"}).Code)
	require.Equal(t, 404, f.req(t, "PATCH", path+"/status", "other", map[string]interface{}{"status": "abierto", "revision": 0}).Code)
	require.Equal(t, 404, supportUpload(t, f, ticket.ID, "other", "controlled-other-upload", supportPNG(t)).Code)
	require.Zero(t, f.store.supportWrites)
	require.Equal(t, 200, f.req(t, "GET", path, "admin", nil).Code)
}
func TestSupportConversationStatusAndReopening(t *testing.T) {
	f := newSecurityFixture(t)
	ticket := createSupport(t, f)
	path := fmt.Sprintf("/api/v1/support/tickets/%d", ticket.ID)
	require.Equal(t, 403, f.req(t, "PATCH", path+"/status", "leader", map[string]interface{}{"status": "en_revision", "revision": 0}).Code)
	require.Equal(t, 200, f.req(t, "PATCH", path+"/status", "admin", map[string]interface{}{"status": "esperando_respuesta", "revision": 0, "note": "Indica qué día corresponde al reporte."}).Code)
	require.Equal(t, 409, f.req(t, "PATCH", path+"/status", "admin", map[string]interface{}{"status": "en_revision", "revision": 0}).Code)
	reply := map[string]string{"body": "Corresponde a la reunión del domingo."}
	header := map[string]string{"Idempotency-Key": "controlled-support-reply"}
	require.Equal(t, 201, f.req(t, "POST", path+"/messages", "leader", reply, header).Code)
	require.Equal(t, 200, f.req(t, "POST", path+"/messages", "leader", reply, header).Code)
	require.NoError(t, f.db.First(&ticket, ticket.ID).Error)
	require.Equal(t, "abierto", ticket.Status)
	require.EqualValues(t, 2, ticket.Revision)
	require.Equal(t, 400, f.req(t, "PATCH", path+"/status", "admin", map[string]interface{}{"status": "resuelto", "revision": 2}).Code)
	require.Equal(t, 200, f.req(t, "PATCH", path+"/status", "admin", map[string]interface{}{"status": "resuelto", "revision": 2, "note": "Se corrigió el error de guardado y se verificó el reporte."}).Code)
	require.Equal(t, 409, f.req(t, "POST", path+"/messages", "leader", reply, map[string]string{"Idempotency-Key": "controlled-resolved-reply"}).Code)
	require.Equal(t, 409, supportUpload(t, f, ticket.ID, "leader", "controlled-resolved-upload", supportPNG(t)).Code)
	require.Equal(t, 200, f.req(t, "PATCH", path+"/status", "leader", map[string]interface{}{"status": "abierto", "revision": 3, "note": "El problema continúa."}).Code)
	var history []models.SupportMessage
	require.NoError(t, f.db.Where("ticket_id = ?", ticket.ID).Order("id").Find(&history).Error)
	require.Len(t, history, 6)
	require.Equal(t, "resuelto", history[5].PreviousStatus)
	require.Equal(t, "abierto", history[5].Status)
	require.Equal(t, 201, f.req(t, "POST", path+"/messages", "leader", reply, map[string]string{"Idempotency-Key": "controlled-resolved-reply"}).Code)
}
func TestSupportAtomicCreationAndRetry(t *testing.T) {
	f := newSecurityFixture(t)
	require.NoError(t, f.db.Exec(`CREATE TRIGGER fail_support_message BEFORE INSERT ON support_messages BEGIN SELECT RAISE(FAIL, 'controlled failure'); END`).Error)
	body := map[string]string{"subject": "Caso con fallo controlado", "module": "general", "body": "Se comprueba que no quede un caso vacío al fallar el guardado."}
	header := map[string]string{"Idempotency-Key": "controlled-failed-case"}
	require.Equal(t, 503, f.req(t, "POST", "/api/v1/support/tickets", "leader", body, header).Code)
	var count int64
	require.NoError(t, f.db.Model(&models.SupportTicket{}).Count(&count).Error)
	require.Zero(t, count)
	require.NoError(t, f.db.Exec(`DROP TRIGGER fail_support_message`).Error)
	require.Equal(t, 201, f.req(t, "POST", "/api/v1/support/tickets", "leader", body, header).Code)
}
func TestSupportPrivateAttachmentsSurviveRetriesWithoutLeaking(t *testing.T) {
	f := newSecurityFixture(t)
	ticket := createSupport(t, f)
	otherSupportLeader(t, f)
	imageData := supportPNG(t)
	invalid := supportUpload(t, f, ticket.ID, "leader", "controlled-invalid-image", []byte("not an image"))
	require.Equal(t, 400, invalid.Code)
	require.Zero(t, f.store.supportWrites)
	f.store.supportFail = true
	first := supportUpload(t, f, ticket.ID, "leader", "controlled-private-capture", imageData)
	require.Equal(t, 503, first.Code)
	f.store.supportFail = false
	retry := supportUpload(t, f, ticket.ID, "leader", "controlled-private-capture", imageData)
	require.Equal(t, 201, retry.Code, retry.Body.String())
	require.NotContains(t, retry.Body.String(), "support-private:")
	require.NotContains(t, retry.Body.String(), "object_reference")
	require.Equal(t, 200, supportUpload(t, f, ticket.ID, "leader", "controlled-private-capture", imageData).Code)
	require.Equal(t, 2, f.store.supportWrites)
	var files []models.SupportAttachment
	require.NoError(t, f.db.Find(&files).Error)
	require.Len(t, files, 1)
	require.Equal(t, "ready", files[0].Status)
	path := fmt.Sprintf("/api/v1/support/tickets/%d/attachments/%d/file", ticket.ID, files[0].ID)
	for _, test := range []struct {
		role string
		code int
	}{{"", 401}, {"member", 403}, {"other", 404}} {
		require.Equal(t, test.code, f.req(t, "GET", path, test.role, nil).Code)
	}
	require.Zero(t, f.store.supportReads)
	read := f.req(t, "GET", path, "leader", nil)
	require.Equal(t, 200, read.Code)
	require.Equal(t, "private support fixture", read.Body.String())
	require.Equal(t, "private, no-store", read.Header().Get("Cache-Control"))
	require.Equal(t, "nosniff", read.Header().Get("X-Content-Type-Options"))
	require.Equal(t, 200, f.req(t, "GET", path, "admin", nil).Code)
	otherTicket := models.SupportTicket{OwnerID: f.users["leader"].ID, OwnerName: "Fixture", Subject: "Otro caso", Module: "general", Status: "abierto", SubmissionKey: "another-key", RequestHash: "hash"}
	require.NoError(t, f.db.Create(&otherTicket).Error)
	mismatch := fmt.Sprintf("/api/v1/support/tickets/%d/attachments/%d/file", otherTicket.ID, files[0].ID)
	require.Equal(t, 404, f.req(t, "GET", mismatch, "leader", nil).Code)
}
func TestSupportUploadLeaseRecoversDatabaseFailure(t *testing.T) {
	f := newSecurityFixture(t)
	ticket := createSupport(t, f)
	require.NoError(t, f.db.Exec(`CREATE TRIGGER fail_support_confirmation BEFORE UPDATE OF status ON support_attachments WHEN NEW.status='ready' BEGIN SELECT RAISE(FAIL, 'controlled failure'); END`).Error)
	require.Equal(t, 503, supportUpload(t, f, ticket.ID, "leader", "controlled-lease-file", supportPNG(t)).Code)
	require.Equal(t, 409, supportUpload(t, f, ticket.ID, "leader", "controlled-lease-file", supportPNG(t)).Code)
	require.NoError(t, f.db.Exec(`DROP TRIGGER fail_support_confirmation`).Error)
	require.NoError(t, f.db.Model(&models.SupportAttachment{}).Where("ticket_id = ?", ticket.ID).Update("lease_until", time.Now().Add(-time.Minute)).Error)
	require.Equal(t, 201, supportUpload(t, f, ticket.ID, "leader", "controlled-lease-file", supportPNG(t)).Code)
	var count int64
	require.NoError(t, f.db.Model(&models.SupportAttachment{}).Count(&count).Error)
	require.EqualValues(t, 1, count)
}
