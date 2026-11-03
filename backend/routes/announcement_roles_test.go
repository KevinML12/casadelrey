package routes_test

import (
	"casadelrey/backend/models"
	"github.com/stretchr/testify/require"
	"testing"
)

func TestAnnouncementsRespectLiveRolesAndNeverSharePrivateFeeds(t *testing.T) {
	f := newSecurityFixture(t)
	for _, role := range []string{"all", "member", "leader", "admin"} {
		require.NoError(t, f.db.Create(&models.Announcement{Title: "target-" + role, Content: "Controlled role-specific content", RoleTarget: role, IsActive: true, CreatedByID: f.users["admin"].ID}).Error)
	}
	// Prime the anonymous cache, then ensure authenticated reads are independent.
	for _, role := range []string{"", "leader", "admin", "volunteer", "member", ""} {
		response := f.req(t, "GET", "/api/v1/announcements", role, nil)
		require.Equal(t, 200, response.Code)
		require.Contains(t, response.Body.String(), "target-all")
		require.Contains(t, response.Body.String(), "target-member")
		if role == "leader" || role == "admin" {
			require.Contains(t, response.Body.String(), "target-leader")
		} else {
			require.NotContains(t, response.Body.String(), "target-leader")
		}
		if role == "admin" {
			require.Contains(t, response.Body.String(), "target-admin")
		} else {
			require.NotContains(t, response.Body.String(), "target-admin")
		}
		if role != "" {
			require.Equal(t, "private, no-store", response.Header().Get("Cache-Control"))
		}
	}
	require.NoError(t, f.db.Model(&models.User{}).Where("id = ?", f.users["admin"].ID).Update("session_version", 1).Error)
	require.Equal(t, 401, f.req(t, "GET", "/api/v1/announcements", "admin", nil).Code)
}
