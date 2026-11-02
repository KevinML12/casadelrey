package database

import (
	"casadelrey/backend/models"
	"encoding/json"
	"gorm.io/gorm"
)

// One-time transfer of the old discovery mapping into the administrator's
// records. An intentionally empty JSON array is never overwritten.
func migrateDiscovery(db *gorm.DB) error {
	interests := map[string]string{"alabanza": "musica", "danza": "musica", "servidores": "personas", "protocolo": "personas", "pancartas": "personas", "maestros_ninos": "ninos", "tecnicos_audiovisuales": "tecnologia", "multimedia": "tecnologia", "oracion": "oracion", "logistica": "organizacion"}
	return db.Transaction(func(tx *gorm.DB) error {
		for key, interest := range interests {
			visibility := "frente"
			if key == "servidores" || key == "tecnicos_audiovisuales" || key == "multimedia" || key == "oracion" || key == "logistica" {
				visibility = "apoyo"
			}
			a, _ := json.Marshal([]string{interest})
			b, _ := json.Marshal([]string{visibility})
			if err := tx.Model(&models.VolunteerArea{}).Where("value = ? AND interests IS NULL AND visibility IS NULL", key).Updates(map[string]interface{}{"interests": string(a), "visibility": string(b)}).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
