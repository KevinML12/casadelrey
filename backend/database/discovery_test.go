package database

import (
	"casadelrey/backend/models"
	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
	"testing"
)

func TestDiscoveryMigrationPreservesAdministratorChoices(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&models.VolunteerArea{}))
	legacy := models.VolunteerArea{Value: "alabanza", Title: "Alabanza"}
	edited := models.VolunteerArea{Value: "danza", Title: "Danza", Interests: []string{}, Visibility: []string{}}
	require.NoError(t, db.Create(&legacy).Error)
	require.NoError(t, db.Create(&edited).Error)
	require.NoError(t, migrateDiscovery(db))
	require.NoError(t, migrateDiscovery(db))
	require.NoError(t, db.First(&legacy, legacy.ID).Error)
	require.Equal(t, []string{"musica"}, legacy.Interests)
	require.Equal(t, []string{"frente"}, legacy.Visibility)
	require.NoError(t, db.First(&edited, edited.ID).Error)
	require.Empty(t, edited.Interests)
	require.Empty(t, edited.Visibility)
}
