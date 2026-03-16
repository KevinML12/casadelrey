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

// VolunteerHandler maneja inscripciones de voluntariado.
type VolunteerHandler struct {
	DB *gorm.DB
}

func NewVolunteerHandler(db *gorm.DB) *VolunteerHandler {
	return &VolunteerHandler{DB: db}
}

// Register POST /api/v1/volunteer/register — público, inscripción de interés.
func (h *VolunteerHandler) Register(c echo.Context) error {
	var req struct {
		Name    string `json:"name"`
		Email   string `json:"email"`
		Phone   string `json:"phone"`
		Area    string `json:"area"`
		Message string `json:"message"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos inválidos."})
	}
	if req.Name == "" || req.Email == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Nombre y email son requeridos."})
	}

	v := models.Volunteer{
		Name:    req.Name,
		Email:   req.Email,
		Phone:   req.Phone,
		Area:    req.Area,
		Message: req.Message,
		Status:  "pendiente",
	}
	if err := h.DB.Create(&v).Error; err != nil {
		log.Printf("[Volunteer] Error al guardar: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "No se pudo registrar. Intenta de nuevo."})
	}

	log.Printf("[Volunteer] Inscripción: %s (%s)", v.Name, v.Email)
	return c.JSON(http.StatusCreated, map[string]interface{}{
		"message": "¡Gracias por tu interés! El equipo se comunicará contigo pronto.",
		"id":      v.ID,
	})
}

// GetAll GET /api/v1/admin/volunteers — admin ve todos, leader solo los asignados.
func (h *VolunteerHandler) GetAll(c echo.Context) error {
	q := h.DB.Model(&models.Volunteer{}).Order("created_at DESC")

	if role, _ := c.Get("user_role").(string); role == "leader" {
		uid, _ := c.Get("user_id").(uint)
		q = q.Where("assigned_leader_id = ?", uid)
	}

	var list []models.Volunteer
	if err := q.Find(&list).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al obtener voluntarios."})
	}
	return c.JSON(http.StatusOK, list)
}

// Assign PUT /api/v1/admin/volunteers/:id/assign — admin asigna a un líder.
func (h *VolunteerHandler) Assign(c echo.Context) error {
	id := c.Param("id")
	var req struct {
		LeaderID uint `json:"leader_id"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "leader_id requerido."})
	}

	var v models.Volunteer
	if err := h.DB.First(&v, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Voluntario no encontrado."})
	}

	var leader models.User
	if err := h.DB.First(&leader, req.LeaderID).Error; err != nil || leader.Role != "leader" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Líder no válido."})
	}

	v.AssignedLeaderID = &req.LeaderID
	v.Status = "asignado"
	h.DB.Save(&v)

	return c.JSON(http.StatusOK, v)
}

// CreateUserFromVolunteer POST /api/v1/admin/volunteers/:id/create-user — admin o líder crea usuario desde voluntario.
func (h *VolunteerHandler) CreateUserFromVolunteer(c echo.Context) error {
	id := c.Param("id")
	var req struct {
		Password string `json:"password"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos inválidos."})
	}
	if len(req.Password) < 6 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "La contraseña debe tener mínimo 6 caracteres."})
	}

	var v models.Volunteer
	if err := h.DB.First(&v, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Voluntario no encontrado."})
	}

	// Si es líder, solo puede crear usuario de voluntarios asignados a él
	if role, _ := c.Get("user_role").(string); role == "leader" {
		uid, _ := c.Get("user_id").(uint)
		if v.AssignedLeaderID == nil || *v.AssignedLeaderID != uid {
			return c.JSON(http.StatusForbidden, map[string]string{"error": "Solo puedes crear usuario de voluntarios asignados a ti."})
		}
	}

	var existing models.User
	if h.DB.Where("email = ?", v.Email).First(&existing).Error == nil {
		return c.JSON(http.StatusConflict, map[string]string{"error": "Ya existe un usuario con ese correo."})
	}

	hashedPassword, err := auth.HashPassword(req.Password)
	if err != nil {
		log.Printf("[Volunteer] Error al hashear contraseña: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al procesar la contraseña."})
	}

	verificationToken := uuid.New().String()
	verificationExpiry := time.Now().Add(24 * time.Hour)

	user := models.User{
		Name:                    v.Name,
		Email:                   v.Email,
		Password:                hashedPassword,
		Role:                    "member",
		VerificationToken:       &verificationToken,
		VerificationTokenExpiry: &verificationExpiry,
	}
	if err := h.DB.Create(&user).Error; err != nil {
		log.Printf("[Volunteer] Error al crear usuario: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al crear el usuario."})
	}

	email.SendEmailAsync(
		user.Email,
		"Verifica tu correo — Casa del Rey",
		email.GetVerificationEmailTemplate(user.Name, verificationToken),
	)

	v.Status = "usuario_creado"
	h.DB.Save(&v)

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"message": "Usuario creado. Se envió correo de verificación al voluntario.",
		"user": map[string]interface{}{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
			"role":  user.Role,
		},
	})
}
