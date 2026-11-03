// This fixture command can only write to a disposable loopback database.
// It is never called by the application or the production deployment.
package main

import (
	"casadelrey/backend/auth"
	"casadelrey/backend/database"
	"casadelrey/backend/models"
	"encoding/json"
	"log"
	"net/url"
	"os"
	"strings"
)

func main() {
	dsn := os.Getenv("DATABASE_URL")
	u, err := url.Parse(dsn)
	if err != nil || os.Getenv("CDR_LOCAL_E2E") != "1" || (u.Hostname() != "127.0.0.1" && u.Hostname() != "localhost") || u.Path != "/cdr_e2e" {
		log.Fatal("fixture seeding requires the isolated cdr_e2e loopback database")
	}
	var accounts []struct{ Role, Name, Email, Password string }
	data, err := os.ReadFile(os.Getenv("E2E_QA_USERS_FILE"))
	if err != nil {
		log.Fatal("private account file unavailable")
	}
	if json.Unmarshal(data, &accounts) != nil || len(accounts) < 4 {
		log.Fatal("invalid fixture accounts")
	}
	db, err := database.Connect(dsn)
	if err != nil {
		log.Fatal(err)
	}
	users := map[string]models.User{}
	for _, account := range accounts {
		if !strings.HasSuffix(account.Email, "@example.invalid") {
			log.Fatal("only reserved fixture emails are allowed")
		}
		hash, err := auth.HashPassword(account.Password)
		if err != nil {
			log.Fatal(err)
		}
		role := account.Role
		if role == "other_leader" {
			role = "leader"
		}
		user := models.User{Name: account.Name, Email: account.Email, Password: hash, Role: role, EmailVerified: true}
		if err := db.Create(&user).Error; err != nil {
			log.Fatal(err)
		}
		users[account.Role] = user
	}
	create := func(value interface{}) {
		if err := db.Create(value).Error; err != nil {
			log.Fatal(err)
		}
	}
	photo := "/images/backgrounds/congregacion.webp"
	for index, role := range []string{"leader", "other_leader"} {
		leader := users[role]
		cell := models.Cell{Code: []string{"J1", "J2"}[index], Name: []string{"Comunidad E2E", "Otra comunidad E2E"}[index], Type: "jovenes", LeaderID: leader.ID, Day: "Miércoles", Time: "19:00", Zone: "Zona de verificación", IsActive: true}
		create(&cell)
		if err := db.Model(&models.User{}).Where("id = ?", leader.ID).Updates(map[string]interface{}{"cell_id": cell.ID, "cell_code": cell.Code, "cell_type": cell.Type}).Error; err != nil {
			log.Fatal(err)
		}
		leaderID := leader.ID
		create(&models.Leader{UserID: &leaderID, Name: leader.Name, Email: leader.Email, Area: "Células", IsActive: true, PhotoURL: photo})
	}
	create(&models.CellCategory{Name: "Jóvenes", TypeKey: "jovenes", Description: "Grupos para compartir y crecer.", ImageURL: photo, IsActive: true})
	create(&models.DonationPurpose{Value: "general", Title: "Ofrenda general", Description: "Apoyo a la comunidad", IsActive: true})
	create(&models.DonationPurpose{Value: "celulas", Title: "Células", Description: "Apoyo a los grupos", IsActive: true})
	create(&models.VolunteerArea{Value: "alabanza", Title: "Alabanza", Description: "Servimos juntos a través de la música.", Why: "Acompaña a la comunidad.", IsActive: true})
	create(&models.VolunteerArea{Value: "logistica", Title: "Logística", Description: "Organización de encuentros.", IsActive: true})
	volunteer, leader := users["volunteer"], users["leader"]
	create(&models.Volunteer{Name: volunteer.Name, Email: volunteer.Email, Department: "alabanza", Status: "usuario_creado", UserID: &volunteer.ID, AssignedLeaderID: &leader.ID})
	create(&models.FAQ{Question: "¿Cómo puedo participar?", Answer: "Puedes contactar al equipo desde el sitio.", IsActive: true})
	create(&models.GalleryPhoto{Album: "Comunidad E2E", Title: "Encuentro de la comunidad", URL: photo, UploadedByID: users["admin"].ID, IsActive: true})
	create(&models.Post{Title: "Una comunidad que sirve", Slug: "comunidad-e2e", Content: "<p>Caminamos y servimos juntos.</p>", Excerpt: "Encuentros de comunidad.", CoverImage: photo, AuthorID: users["admin"].ID, Status: "published"})
	create(&models.Event{Title: "Encuentro de comunidad", Date: "2099-12-01", Time: "18:00", Description: "Un encuentro para compartir.", CoverImage: photo, IsActive: true})
	create(&models.HeroSetting{TitleLine1: "Casa del Rey", TitleLine2: "Una familia que sirve", BackgroundImageURL: photo, IsActive: true})
	log.Print("isolated accounts and community fixtures created")
}
