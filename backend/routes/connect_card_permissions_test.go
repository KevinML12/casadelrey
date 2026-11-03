package routes_test

import (
	"fmt"
	"testing"

	"casadelrey/backend/models"
	"github.com/stretchr/testify/require"
)

func TestConnectCardsOnlyReachAssignedLeadersAndAdminControlsAssignments(t *testing.T) {
	f := newSecurityFixture(t)
	leaderID, adminID := f.users["leader"].ID, f.users["admin"].ID
	own := models.ConnectCard{Name: "Own request", Phone: "00000000", Category: "busco_celula", Status: "nuevo", LeaderAssignedID: &leaderID}
	other := models.ConnectCard{Name: "Other private request", Phone: "00000001", Category: "primera_vez", Status: "nuevo", LeaderAssignedID: &adminID}
	require.NoError(t, f.db.Create(&own).Error)
	require.NoError(t, f.db.Create(&other).Error)
	path := fmt.Sprintf("/api/v1/admin/connect-cards/%d", own.ID)
	list := f.req(t, "GET", "/api/v1/admin/connect-cards", "leader", nil)
	require.Equal(t, 200, list.Code)
	require.Contains(t, list.Body.String(), own.Name)
	require.NotContains(t, list.Body.String(), other.Name)
	require.Equal(t, 404, f.req(t, "PUT", fmt.Sprintf("/api/v1/admin/connect-cards/%d", other.ID), "leader", map[string]string{"status": "integrado"}).Code)
	require.Equal(t, 403, f.req(t, "PUT", path, "leader", map[string]interface{}{"leader_assigned_id": adminID}).Code)
	require.Equal(t, 200, f.req(t, "PUT", path, "leader", map[string]string{"status": "contactado"}).Code)
	require.Equal(t, 400, f.req(t, "PUT", path, "admin", map[string]interface{}{"leader_assigned_id": f.users["member"].ID}).Code)
	require.Equal(t, 200, f.req(t, "PUT", path, "admin", map[string]interface{}{"leader_assigned_id": nil}).Code)
	var saved models.ConnectCard
	require.NoError(t, f.db.First(&saved, own.ID).Error)
	require.Nil(t, saved.LeaderAssignedID)
	require.Equal(t, 404, f.req(t, "PUT", path, "leader", map[string]string{"status": "integrado"}).Code)
	require.NotContains(t, f.req(t, "GET", "/api/v1/admin/connect-cards", "leader", nil).Body.String(), own.Name)
	require.Contains(t, f.req(t, "GET", "/api/v1/admin/connect-cards", "admin", nil).Body.String(), other.Name)
}
