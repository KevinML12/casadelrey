package handlers

import (
	"log"
	"net/http"
	"strconv"
	"time"

	"casadelrey/backend/auth"
	"casadelrey/backend/email"
	"casadelrey/backend/models"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// AdminHandler centraliza los endpoints del panel de administración.
type AdminHandler struct {
	DB *gorm.DB
}

// NewAdminHandler crea una nueva instancia del handler admin.
func NewAdminHandler(db *gorm.DB) *AdminHandler {
	return &AdminHandler{DB: db}
}

// GetKPIs godoc
// GET /api/v1/admin/kpis  [Requiere auth + rol admin]
// Devuelve métricas clave del dashboard: totales de usuarios, donaciones, peticiones
// y el total monetario recaudado.
func (h *AdminHandler) GetKPIs(c echo.Context) error {
	var (
		totalUsers     int64
		totalDonations int64
		totalPetitions int64
		totalRevenue   float64
	)

	if err := h.DB.Model(&models.User{}).Count(&totalUsers).Error; err != nil {
		log.Printf("[Admin] Error al contar usuarios: %v", err)
	}
	if err := h.DB.Model(&models.Donation{}).Where("is_successful = ?", true).Count(&totalDonations).Error; err != nil {
		log.Printf("[Admin] Error al contar donaciones: %v", err)
	}
	if err := h.DB.Model(&models.Petition{}).Count(&totalPetitions).Error; err != nil {
		log.Printf("[Admin] Error al contar peticiones: %v", err)
	}
	if err := h.DB.Model(&models.Donation{}).
		Where("is_successful = ?", true).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&totalRevenue).Error; err != nil {
		log.Printf("[Admin] Error al calcular ingresos: %v", err)
	}

	var totalBlogViews int64
	if err := h.DB.Model(&models.Post{}).Select("COALESCE(SUM(view_count), 0)").Scan(&totalBlogViews).Error; err != nil {
		log.Printf("[Admin] Error al contar vistas blog: %v", err)
	}

	var totalCellReports int64
	if err := h.DB.Model(&models.CellReport{}).Count(&totalCellReports).Error; err != nil {
		log.Printf("[Admin] Error al contar reportes células: %v", err)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"total_users":      totalUsers,
		"total_donations":  totalDonations,
		"total_petitions":  totalPetitions,
		"total_revenue":    totalRevenue,
		"total_blog_views": totalBlogViews,
		"total_cell_reports": totalCellReports,
	})
}

// trendPoint es un dia de la serie del trend chart del dashboard.
type trendPoint struct {
	Date            string  `json:"date"`
	DonationsAmount float64 `json:"donations_amount"`
	DonationsCount  int64   `json:"donations_count"`
	NewUsers        int64   `json:"new_users"`
}

// GetKPIsTrend godoc
// GET /api/v1/admin/kpis/trend?days=N  [Requiere auth + rol admin]
// Serie diaria (donaciones + usuarios nuevos) de los ultimos N dias
// (default 30, tope 365), con dias sin actividad en cero para que el
// grafico no tenga huecos.
func (h *AdminHandler) GetKPIsTrend(c echo.Context) error {
	days, err := strconv.Atoi(c.QueryParam("days"))
	if err != nil || days <= 0 {
		days = 30
	}
	if days > 365 {
		days = 365
	}

	since := time.Now().AddDate(0, 0, -(days - 1))
	sinceDay := since.Format("2006-01-02")

	type dailyDonation struct {
		Day    string
		Amount float64
		Count  int64
	}
	var donationRows []dailyDonation
	if err := h.DB.Model(&models.Donation{}).
		Where("is_successful = ? AND created_at >= ?", true, sinceDay).
		Select("TO_CHAR(created_at, 'YYYY-MM-DD') as day, COALESCE(SUM(amount),0) as amount, COUNT(*) as count").
		Group("day").
		Scan(&donationRows).Error; err != nil {
		log.Printf("[Admin] Error al calcular tendencia de donaciones: %v", err)
	}

	type dailyUsers struct {
		Day   string
		Count int64
	}
	var userRows []dailyUsers
	if err := h.DB.Model(&models.User{}).
		Where("created_at >= ?", sinceDay).
		Select("TO_CHAR(created_at, 'YYYY-MM-DD') as day, COUNT(*) as count").
		Group("day").
		Scan(&userRows).Error; err != nil {
		log.Printf("[Admin] Error al calcular tendencia de usuarios: %v", err)
	}

	donationByDay := make(map[string]dailyDonation, len(donationRows))
	for _, r := range donationRows {
		donationByDay[r.Day] = r
	}
	usersByDay := make(map[string]int64, len(userRows))
	for _, r := range userRows {
		usersByDay[r.Day] = r.Count
	}

	series := make([]trendPoint, 0, days)
	for i := 0; i < days; i++ {
		day := since.AddDate(0, 0, i).Format("2006-01-02")
		don := donationByDay[day]
		series = append(series, trendPoint{
			Date:            day,
			DonationsAmount: don.Amount,
			DonationsCount:  don.Count,
			NewUsers:        usersByDay[day],
		})
	}

	return c.JSON(http.StatusOK, series)
}

// GetDonations godoc
// GET /api/v1/admin/donations  [Requiere auth + rol admin]
// Lista donaciones exitosas con búsqueda y paginación.
func (h *AdminHandler) GetDonations(c echo.Context) error {
	page, limit := parsePage(c)

	q := h.DB.Model(&models.Donation{}).Where("is_successful = ?", true)
	if search := c.QueryParam("q"); search != "" {
		like := "%" + search + "%"
		q = q.Where("name ILIKE ? OR email ILIKE ?", like, like)
	}
	if purpose := c.QueryParam("purpose"); purpose != "" {
		q = q.Where("donation_purpose = ?", purpose)
	}

	var total int64
	q.Count(&total)

	offset := (page - 1) * limit
	var donations []models.Donation
	if err := q.Order("created_at DESC").Offset(offset).Limit(limit).Find(&donations).Error; err != nil {
		log.Printf("[Admin] Error al obtener donaciones: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Error al obtener las donaciones.",
		})
	}

	return c.JSON(http.StatusOK, PagedResponse{Data: donations, Meta: newMeta(total, page, limit)})
}

// UpdateUserRole PUT /api/v1/admin/users/:id/role — admin, actualizar rol (member, leader, admin).
func (h *AdminHandler) UpdateUserRole(c echo.Context) error {
	id := c.Param("id")
	var req struct {
		Role string `json:"role"`
	}
	if err := c.Bind(&req); err != nil || req.Role == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Se requiere el campo 'role'."})
	}
	validRoles := map[string]bool{"member": true, "leader": true, "volunteer": true, "admin": true}
	if !validRoles[req.Role] {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Rol debe ser member, leader, volunteer o admin."})
	}
	if result := h.DB.Model(&models.User{}).Where("id = ?", id).Update("role", req.Role); result.Error != nil || result.RowsAffected == 0 {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Usuario no encontrado."})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Rol actualizado."})
}

// UpdateUserCell PUT /api/v1/admin/users/:id/cell — admin, asignar código y tipo de célula a un líder.
func (h *AdminHandler) UpdateUserCell(c echo.Context) error {
	id := c.Param("id")
	var req struct {
		CellCode string `json:"cell_code"`
		CellType string `json:"cell_type"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos inválidos."})
	}
	validTypes := map[string]bool{"hombres": true, "mujeres": true, "jovenes": true, "prejus": true, "ninos": true, "": true}
	if !validTypes[req.CellType] {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Tipo de célula no válido."})
	}
	result := h.DB.Model(&models.User{}).Where("id = ?", id).Updates(map[string]interface{}{
		"cell_code": req.CellCode,
		"cell_type": req.CellType,
	})
	if result.Error != nil || result.RowsAffected == 0 {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Usuario no encontrado."})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Código de célula actualizado."})
}

// GetUsers GET /api/v1/admin/users — admin obtiene todos los usuarios (con búsqueda y paginación).
func (h *AdminHandler) GetUsers(c echo.Context) error {
	page, limit := parsePage(c)

	q := h.DB.Model(&models.User{})
	if search := c.QueryParam("q"); search != "" {
		like := "%" + search + "%"
		q = q.Where("name ILIKE ? OR email ILIKE ?", like, like)
	}
	if role := c.QueryParam("role"); role != "" {
		q = q.Where("role = ?", role)
	}

	var total int64
	q.Count(&total)

	offset := (page - 1) * limit
	var users []models.User
	if err := q.Order("created_at DESC").Offset(offset).Limit(limit).Find(&users).Error; err != nil {
		log.Printf("[Admin] Error al obtener usuarios: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al obtener usuarios."})
	}
	for i := range users {
		users[i].Password = ""
	}
	return c.JSON(http.StatusOK, PagedResponse{Data: users, Meta: newMeta(total, page, limit)})
}

// GetLeaders GET /api/v1/admin/leaders — admin obtiene lista de líderes para asignar voluntarios.
func (h *AdminHandler) GetLeaders(c echo.Context) error {
	var leaders []struct {
		ID    uint   `json:"id"`
		Name  string `json:"name"`
		Email string `json:"email"`
	}
	if err := h.DB.Model(&models.User{}).Where("role = ?", "leader").Select("id, name, email").Find(&leaders).Error; err != nil {
		log.Printf("[Admin] Error al obtener líderes: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al obtener líderes."})
	}
	return c.JSON(http.StatusOK, leaders)
}

// CreateUser POST /api/v1/admin/users — admin o líder crea un usuario (solo ellos pueden crear cuentas).
func (h *AdminHandler) CreateUser(c echo.Context) error {
	var req struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
		Role     string `json:"role"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos inválidos."})
	}
	if req.Name == "" || req.Email == "" || len(req.Password) < 6 {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Nombre, email y contraseña (mín. 6 caracteres) son requeridos.",
		})
	}
	role := req.Role
	if role == "" {
		role = "member"
	}
	validRoles2 := map[string]bool{"member": true, "leader": true, "volunteer": true, "admin": true}
	if !validRoles2[role] {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Rol debe ser member, leader, volunteer o admin."})
	}
	// Solo admin puede crear líderes, voluntarios o admins
	if role != "member" {
		if r, _ := c.Get("user_role").(string); r != "admin" {
			return c.JSON(http.StatusForbidden, map[string]string{"error": "Solo un administrador puede asignar este rol."})
		}
	}

	var existing models.User
	if h.DB.Where("email = ?", req.Email).First(&existing).Error == nil {
		return c.JSON(http.StatusConflict, map[string]string{"error": "Este email ya está registrado."})
	}

	hashedPassword, err := auth.HashPassword(req.Password)
	if err != nil {
		log.Printf("[Admin] Error al hashear contraseña: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al procesar la contraseña."})
	}

	verificationToken := uuid.New().String()
	verificationExpiry := time.Now().Add(24 * time.Hour)

	user := models.User{
		Name:                    req.Name,
		Email:                   req.Email,
		Password:                hashedPassword,
		Role:                    role,
		VerificationToken:       &verificationToken,
		VerificationTokenExpiry: &verificationExpiry,
	}
	if err := h.DB.Create(&user).Error; err != nil {
		log.Printf("[Admin] Error al crear usuario: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al crear el usuario."})
	}

	email.SendEmailAsync(
		user.Email,
		"Verifica tu correo — Casa del Rey",
		email.GetVerificationEmailTemplate(user.Name, verificationToken),
	)

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"message": "Usuario creado. Se envió un correo de verificación.",
		"user": map[string]interface{}{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
			"role":  user.Role,
		},
	})
}
