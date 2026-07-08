package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"casadelrey/backend/models"

	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func hash(pw string) string {
	b, err := bcrypt.GenerateFromPassword([]byte(pw), bcrypt.DefaultCost)
	if err != nil { log.Fatal(err) }
	return string(b)
}

func main() {
	_ = godotenv.Load()
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" { log.Fatal("DATABASE_URL no configurada") }

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{Logger: logger.Default.LogMode(logger.Silent)})
	if err != nil { log.Fatalf("Error BD: %v", err) }

	db.AutoMigrate(
		&models.User{}, &models.Post{}, &models.Event{}, &models.CellReport{},
		&models.MemberBoleta{}, &models.Volunteer{}, &models.Announcement{},
		&models.GalleryPhoto{}, &models.Donation{}, &models.Petition{},
		&models.EventRegistration{}, &models.SocialPost{}, &models.UserGoal{},
		&models.ActivityLog{}, &models.CellCategory{}, &models.HeroSetting{},
	)
	fmt.Println("Tablas migradas")

	users := []models.User{
		{Name: "Pastor Roberto Mendez", Email: "pastor@casadelrey.org", Password: hash("Admin2026!"), Role: "admin",     EmailVerified: true},
		{Name: "Carlos Mendez",         Email: "carlos@casadelrey.org", Password: hash("Admin2026!"), Role: "admin",     EmailVerified: true},
		{Name: "Leonel Garcia",         Email: "leonel@casadelrey.org", Password: hash("Lider2026!"), Role: "leader",    CellCode: "H1", CellType: "hombres", EmailVerified: true},
		{Name: "Ana Perez",             Email: "ana@casadelrey.org",    Password: hash("Lider2026!"), Role: "leader",    CellCode: "M1", CellType: "mujeres", EmailVerified: true},
		{Name: "Diego Rodriguez",       Email: "diego@casadelrey.org",  Password: hash("Lider2026!"), Role: "leader",    CellCode: "J1", CellType: "jovenes", EmailVerified: true},
		{Name: "Josue Ramirez",         Email: "josue@casadelrey.org",  Password: hash("Lider2026!"), Role: "leader",    CellCode: "H2", CellType: "hombres", EmailVerified: true},
		{Name: "Sofia Castillo",        Email: "sofia@casadelrey.org",  Password: hash("Lider2026!"), Role: "leader",    CellCode: "P1", CellType: "prejus",  EmailVerified: true},
		{Name: "Juan Voluntario",       Email: "juan.v@casadelrey.org", Password: hash("Vol2026!"),   Role: "volunteer", EmailVerified: true},
	}
	for i := range users {
		var ex models.User
		if db.Where("email = ?", users[i].Email).First(&ex).Error == nil {
			// Actualizar contraseña, rol y verificación del usuario existente
			ex.Password = users[i].Password
			ex.Role = users[i].Role
			ex.EmailVerified = users[i].EmailVerified
			ex.CellCode = users[i].CellCode
			ex.CellType = users[i].CellType
			db.Save(&ex)
			fmt.Printf("  ~ updated: %s (%s)\n", users[i].Email, users[i].Role)
			continue
		}
		db.Create(&users[i])
		fmt.Printf("  + %s (%s)\n", users[i].Name, users[i].Role)
	}

	var pastor, leonel models.User
	db.Where("email = ?", "pastor@casadelrey.org").First(&pastor)
	db.Where("email = ?", "leonel@casadelrey.org").First(&leonel)

	posts := []models.Post{
		{Title: "La fe que mueve montanas", Slug: "la-fe-que-mueve-montanas", Content: "<p>La fe no es simplemente creer. Es la certeza de lo que esperamos. Hebreos 11:1 nos recuerda que cada gran obra comenzo con alguien que creyó.</p>", Excerpt: "La fe es la certeza de lo que esperamos.", CoverImage: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800", AuthorID: pastor.ID, Status: "published"},
		{Title: "Familia el ministerio mas importante", Slug: "familia-ministerio-importante", Content: "<p>Antes de liderar una celula, esta el ministerio del hogar. No podemos dar lo que no tenemos.</p>", Excerpt: "El ministerio mas importante comienza en casa.", CoverImage: "https://images.unsplash.com/photo-1511895426328-dc8714191011?w=800", AuthorID: pastor.ID, Status: "published"},
		{Title: "Revive el culto del domingo", Slug: "culto-domingo-instagram", Content: "<p>Este domingo mas de 200 personas se reunieron en busca de Dios. Fue una noche de milagros.</p>", Excerpt: "Revive el culto del domingo pasado.", CoverImage: "https://images.unsplash.com/photo-1478147427282-58a87a120781?w=800", RedirectURL: "https://www.instagram.com/casadelreyhue/", AuthorID: pastor.ID, Status: "published"},
	}
	for i := range posts {
		var ex models.Post
		if db.Where("slug = ?", posts[i].Slug).First(&ex).Error == nil {
			fmt.Printf("  skip post: %s\n", posts[i].Slug)
			continue
		}
		db.Create(&posts[i])
		fmt.Printf("  + post: %s\n", posts[i].Title)
	}

	events := []models.Event{
		{Title: "Culto de Avivamiento",   Date: "2026-06-15", Location: "Templo Central, Zona 1, Huehuetenango", Description: "Una noche especial de adoracion y milagros. Ven con expectativa.", IsActive: true},
		{Title: "Campamento de Jovenes",  Date: "2026-07-04", Location: "Campamento El Retiro, km 45",          Description: "3 dias de encuentro para jovenes de 15 a 30 anos.", IsActive: true},
		{Title: "Conferencia de Lideres", Date: "2026-06-28", Location: "Salon de Eventos Casa del Rey",        Description: "Capacitacion para lideres de celula. Obligatorio.", IsActive: true},
	}
	for i := range events {
		var ex models.Event
		if db.Where("title = ?", events[i].Title).First(&ex).Error == nil {
			fmt.Printf("  skip evento: %s\n", events[i].Title)
			continue
		}
		db.Create(&events[i])
		fmt.Printf("  + evento: %s\n", events[i].Title)
	}

	cellCats := []models.CellCategory{
		{Name: "Adolescentes", AgeGroup: "15 a 24 años", Description: "Reuniones dinámicas para adolescentes.", ImageURL: "/images/celulas/adolescentes.jpg"},
		{Name: "Jóvenes Adultos", AgeGroup: "Solteros", Description: "Comunidad para jóvenes profesionales y universitarios.", ImageURL: "/images/celulas/jovenes.jpg"},
		{Name: "Prejuveniles", AgeGroup: "12 a 15 años", Description: "Un espacio seguro y divertido para crecer.", ImageURL: "/images/celulas/prejuveniles.jpg"},
		{Name: "Varones", AgeGroup: "Hombres", Description: "Hombres compartiendo la palabra y construyendo familia.", ImageURL: "/images/celulas/varones.jpg"},
		{Name: "Mujeres", AgeGroup: "Mujeres", Description: "Un espacio de formación espiritual, apoyo mutuo y hermandad.", ImageURL: "/images/celulas/mujeres.jpg"},
	}
	for i := range cellCats {
		var ex models.CellCategory
		if db.Where("name = ?", cellCats[i].Name).First(&ex).Error == nil {
			// Update if exists to reflect new image paths
			ex.AgeGroup = cellCats[i].AgeGroup
			ex.Description = cellCats[i].Description
			ex.ImageURL = cellCats[i].ImageURL
			db.Save(&ex)
			fmt.Printf("  ~ updated cell category: %s\n", cellCats[i].Name)
			continue
		}
		db.Create(&cellCats[i])
		fmt.Printf("  + cell category: %s\n", cellCats[i].Name)
	}

	d1 := time.Now().AddDate(0, 0, -7).Format("2006-01-02")
	d2 := time.Now().AddDate(0, 0, -14).Format("2006-01-02")
	d3 := time.Now().AddDate(0, 0, -3).Format("2006-01-02")

	reports := []models.CellReport{
		{CellCode: "H1", CellName: "Guerreros del Rey",          CellType: "hombres", MeetingDate: d1, LeaderID: &leonel.ID, LeaderName: "Leonel Garcia", PastorName: "Pastor Roberto Mendez", HostName: "Don Francisco Alvarado", HostPhone: "+502 5555-1234", Address: "6a calle 3-45 Zona 3", Topic: "El varon conforme al corazon de Dios", TotalAttendees: 18, Converts: 2, Reconciled: 1, NewMembers: 3, Offering: 350.00, PhotoURL: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600", Status: "aprobado", ApprovedByID: &pastor.ID},
		{CellCode: "M1", CellName: "Esther Mujeres de Proposito",CellType: "mujeres", MeetingDate: d1, LeaderName: "Ana Perez",       PastorName: "Pastor Roberto Mendez", HostName: "Dona Carmen Perez",     HostPhone: "+502 5566-7890", Address: "Residencial Las Palmas",   Topic: "Mujer virtuosa Proverbios 31",         TotalAttendees: 23, Converts: 1, Reconciled: 3, NewMembers: 4, Offering: 420.00, PhotoURL: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600", Status: "aprobado", ApprovedByID: &pastor.ID},
		{CellCode: "J1", CellName: "Generacion Fuego",           CellType: "jovenes", MeetingDate: d2, LeaderName: "Diego Rodriguez", PastorName: "Pastor Roberto Mendez", HostName: "Familia Gonzalez",      HostPhone: "+502 5577-4321", Address: "Colonia El Maestro",       Topic: "Identidad en Cristo",                 TotalAttendees: 31, Converts: 4, Reconciled: 2, NewMembers: 6, Offering: 280.00, Status: "aprobado", ApprovedByID: &pastor.ID},
		{CellCode: "P1", CellName: "Nueva Generacion",           CellType: "prejus",  MeetingDate: d3, LeaderName: "Sofia Castillo",  PastorName: "Pastor Roberto Mendez", HostName: "Familia Mendez",        HostPhone: "+502 5588-9999", Address: "5a Avenida 10-22 Zona 1", Topic: "Proposito de Dios para jovenes",      TotalAttendees: 15, Converts: 3, Reconciled: 0, NewMembers: 3, Offering: 150.00, Status: "pendiente"},
	}
	for i := range reports {
		var ex models.CellReport
		if db.Where("cell_code = ? AND meeting_date = ?", reports[i].CellCode, reports[i].MeetingDate).First(&ex).Error == nil {
			fmt.Printf("  skip reporte: %s\n", reports[i].CellCode)
			continue
		}
		db.Create(&reports[i])
		fmt.Printf("  + reporte: %s - %s\n", reports[i].CellCode, reports[i].CellName)
	}

	boletas := []models.MemberBoleta{
		{Date: d1, InviterName: "Leonel Garcia",   InviterPhone: "+502 5555-0001", GuestName: "Ernesto Barrios",  GuestPhone: "+502 5512-3456", Address: "Zona 3, Huehue", Category: "convertido",   LeaderID: &leonel.ID},
		{Date: d1, InviterName: "Ana Perez",       InviterPhone: "+502 5555-0002", GuestName: "Lucia Hernandez", GuestPhone: "+502 5523-4567", Address: "Zona 5, Huehue", Category: "reconciliado", LeaderID: &leonel.ID},
		{Date: d2, InviterName: "Diego Rodriguez", InviterPhone: "+502 5555-0003", GuestName: "Marco Aju",       GuestPhone: "+502 5534-5678", Address: "Chiantla",        Category: "convertido",   LeaderID: &leonel.ID},
		{Date: d3, InviterName: "Sofia Castillo",  InviterPhone: "+502 5555-0004", GuestName: "Valeria Gomez",   GuestPhone: "+502 5545-6789", Address: "Zona 1, Huehue", Category: "nuevo",        LeaderID: &leonel.ID},
	}
	for i := range boletas {
		var ex models.MemberBoleta
		if db.Where("guest_name = ? AND date = ?", boletas[i].GuestName, boletas[i].Date).First(&ex).Error == nil {
			fmt.Printf("  skip boleta: %s\n", boletas[i].GuestName)
			continue
		}
		db.Create(&boletas[i])
		fmt.Printf("  + boleta: %s (%s)\n", boletas[i].GuestName, boletas[i].Category)
	}

	volunteers := []models.Volunteer{
		{Name: "Kevin Aju",        Email: "kevin.aju@gmail.com",  Phone: "+502 5561-1111", Department: "alabanza",               Message: "Toco guitarra desde los 12 anos",   Status: "pendiente"},
		{Name: "Patricia Orozco",  Email: "patricia.o@gmail.com", Phone: "+502 5562-2222", Department: "danza",                  Message: "Dance en mi iglesia anterior 3 anos", Status: "pendiente"},
		{Name: "Rene Alvarado",    Email: "rene.a@gmail.com",     Phone: "+502 5563-3333", Department: "tecnicos_audiovisuales", Message: "Tecnico en sonido profesional",     Status: "asignado", AssignedLeaderID: &leonel.ID},
		{Name: "Gloria Cifuentes", Email: "gloria.c@gmail.com",   Phone: "+502 5564-4444", Department: "servidores",             Message: "Quiero servir con hospitalidad",    Status: "pendiente"},
	}
	for i := range volunteers {
		var ex models.Volunteer
		if db.Where("email = ?", volunteers[i].Email).First(&ex).Error == nil {
			fmt.Printf("  skip voluntario: %s\n", volunteers[i].Email)
			continue
		}
		db.Create(&volunteers[i])
		fmt.Printf("  + voluntario: %s -> %s\n", volunteers[i].Name, volunteers[i].Department)
	}

	now := time.Now()
	announcements := []models.Announcement{
		{Title: "Ayuno y oracion 3 dias",         Content: "Del 16 al 18 de junio estaremos en ayuno congregacional. Transmision en vivo a las 7pm.", RoleTarget: "all",    IsActive: true, PublishedAt: &now, CreatedByID: pastor.ID},
		{Title: "Reunion obligatoria de lideres",  Content: "Sabado 22 de junio a las 9am en el salon principal. Traer reporte del mes.",              RoleTarget: "leader", IsActive: true, PublishedAt: &now, CreatedByID: pastor.ID},
	}
	for i := range announcements {
		var ex models.Announcement
		if db.Where("title = ?", announcements[i].Title).First(&ex).Error == nil {
			fmt.Printf("  skip anuncio: %s\n", announcements[i].Title)
			continue
		}
		db.Create(&announcements[i])
		fmt.Printf("  + anuncio: %s\n", announcements[i].Title)
	}

	petitions := []models.Petition{
		{Name: "Maria Gonzalez", Email: "maria.g@email.com",  Category: "salud",      Subject: "Sanidad para mi mama",          Message: "Mi mama tiene cancer. Creo en el poder de Dios para sanarla.",        IsAnswered: false},
		{Name: "Carlos Ramos",   Email: "carlos.r@email.com", Category: "familia",    Subject: "Restauracion de mi matrimonio", Message: "Mi esposa y yo estamos en crisis. Necesitamos restauracion familiar.", IsAnswered: false},
		{Name: "Jorge Mendez",   Email: "jorge.m@email.com",  Category: "ministerio", Subject: "Direccion para mi llamado",     Message: "Siento el llamado de Dios pero no se en que area servir.",            IsAnswered: false},
	}
	for i := range petitions {
		var ex models.Petition
		if db.Where("email = ? AND subject = ?", petitions[i].Email, petitions[i].Subject).First(&ex).Error == nil {
			fmt.Printf("  skip peticion: %s\n", petitions[i].Subject)
			continue
		}
		db.Create(&petitions[i])
		fmt.Printf("  + peticion: %s\n", petitions[i].Subject)
	}

	photos := []models.GalleryPhoto{
		{Title: "Culto Avivamiento Mayo 2026", URL: "https://images.unsplash.com/photo-1478147427282-58a87a120781?w=800", IsActive: true, UploadedByID: pastor.ID},
		{Title: "Campamento Jovenes 2025",     URL: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800", IsActive: true, UploadedByID: pastor.ID},
		{Title: "Celulas en accion",           URL: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800", IsActive: true, UploadedByID: pastor.ID},
		{Title: "Bautismos Abril 2026",        URL: "https://images.unsplash.com/photo-1438032005730-c779502df39b?w=800", IsActive: true, UploadedByID: pastor.ID},
	}
	for i := range photos {
		var ex models.GalleryPhoto
		if db.Where("title = ?", photos[i].Title).First(&ex).Error == nil {
			fmt.Printf("  skip foto: %s\n", photos[i].Title)
			continue
		}
		db.Create(&photos[i])
		fmt.Printf("  + foto: %s\n", photos[i].Title)
	}

	donations := []models.Donation{
		{Name: "Pedro Alvarado",  Email: "pedro.a@email.com",  Amount: 500.00,  Currency: "GTQ", PaymentMethod: "transferencia", PaymentReference: "TRF-2026-001", IsSuccessful: true, DonationPurpose: "Diezmo"},
		{Name: "Sandra Lopez",    Email: "sandra.l@email.com", Amount: 200.00,  Currency: "GTQ", PaymentMethod: "tigo_money",    PaymentReference: "TM-2026-002",  IsSuccessful: true, DonationPurpose: "Ofrenda"},
		{Name: "Familia Ramirez", Email: "fam.r@email.com",    Amount: 1000.00, Currency: "GTQ", PaymentMethod: "presencial",    PaymentReference: "PRES-2026-003",IsSuccessful: true, DonationPurpose: "Construccion"},
	}
	for i := range donations {
		var ex models.Donation
		if db.Where("payment_reference = ?", donations[i].PaymentReference).First(&ex).Error == nil {
			fmt.Printf("  skip donacion: %s\n", donations[i].PaymentReference)
			continue
		}
		db.Create(&donations[i])
		fmt.Printf("  + donacion: Q%.0f - %s\n", donations[i].Amount, donations[i].DonationPurpose)
	}

	db.Where("1 = 1").Delete(&models.HeroSetting{})
	hero := models.HeroSetting{
		LabelTop:         "● IGLESIA CRISTIANA · HUEHUETENANGO",
		TitleLine1:       "LUZ PARA",
		TitleLine2:       "LAS NACIONES",
		Subtitle:         "Una generación encendida que adora, sirve y lleva esperanza a cada rincón de la ciudad.",
		CTAPrimaryText:     "Planifica tu visita",
		CTAPrimaryURL:      "/visita",
		BackgroundImageURL: "/images/bg-hero.jpg",
		IsActive:           true,
	}
	db.Create(&hero)
	log.Println("Hero setting planted.")

	fmt.Println("\nSeed completado!")
	fmt.Println("\nCredenciales:")
	fmt.Println("  Admin:      pastor@casadelrey.org / Admin2026!")
	fmt.Println("  Lider:      leonel@casadelrey.org / Lider2026!")
	fmt.Println("  Voluntario: juan.v@casadelrey.org / Vol2026!")
}
