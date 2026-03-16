package handlers

import (
	"log"
	"net/http"
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

// GetDonations godoc
// GET /api/v1/admin/donations  [Requiere auth + rol admin]
// Lista las últimas 50 donaciones exitosas, ordenadas por más recientes.
func (h *AdminHandler) GetDonations(c echo.Context) error {
	var donations []models.Donation
	result := h.DB.
		Where("is_successful = ?", true).
		Order("created_at DESC").
		Limit(50).
		Find(&donations)

	if result.Error != nil {
		log.Printf("[Admin] Error al obtener donaciones: %v", result.Error)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Error al obtener las donaciones.",
		})
	}

	return c.JSON(http.StatusOK, donations)
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
	if req.Role != "member" && req.Role != "leader" && req.Role != "admin" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Rol debe ser member, leader o admin."})
	}
	if result := h.DB.Model(&models.User{}).Where("id = ?", id).Update("role", req.Role); result.Error != nil || result.RowsAffected == 0 {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Usuario no encontrado."})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Rol actualizado."})
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
	if role != "member" && role != "leader" && role != "admin" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Rol debe ser member, leader o admin."})
	}
	// Solo admin puede crear líderes o admins
	if role != "member" {
		if r, _ := c.Get("user_role").(string); r != "admin" {
			return c.JSON(http.StatusForbidden, map[string]string{"error": "Solo un administrador puede crear líderes o admins."})
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
