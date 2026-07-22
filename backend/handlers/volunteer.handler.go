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

// Departments queda de referencia para GetDepartments (endpoint viejo,
// sin consumidores en el frontend hoy) -- la validacion real de Register
// y la fuente de verdad de los departamentos es VolunteerArea (DB,
// editable desde /admin/volunteer-areas). Ver volunteerArea.handler.go.
var Departments = []string{
	"alabanza",
	"danza",
	"servidores",
	"protocolo",
	"pancartas",
	"maestros_ninos",
	"tecnicos_audiovisuales",
	"multimedia",
	"oracion",
	"logistica",
}

// NoPreferenceDepartment es el valor especial que manda el frontend
// cuando el postulante no elige un departamento y prefiere que el
// equipo lo recomiende (VolunteeringPage.jsx, NO_PREFERENCE). No es una
// fila real de VolunteerArea -- se excluye de la validacion.
const NoPreferenceDepartment = "sin_preferencia"

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
		Name       string `json:"name"`
		Email      string `json:"email"`
		Phone      string `json:"phone"`
		Department string `json:"department"`
		Message    string `json:"message"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos inválidos."})
	}
	if req.Name == "" || req.Email == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Nombre y email son requeridos."})
	}
	// Los departamentos ahora se validan contra VolunteerArea (editable
	// desde el admin), no contra el array hardcodeado -- "sin_preferencia"
	// es el unico valor que NO es una fila real (ver VolunteeringPage.jsx,
	// NO_PREFERENCE: el postulante delega la eleccion al equipo).
	if req.Department != "" && req.Department != NoPreferenceDepartment {
		var count int64
		h.DB.Model(&models.VolunteerArea{}).Where("value = ? AND is_active = ?", req.Department, true).Count(&count)
		if count == 0 {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Departamento no válido."})
		}
	}

	v := models.Volunteer{
		Name:       req.Name,
		Email:      req.Email,
		Phone:      req.Phone,
		Department: req.Department,
		Message:    req.Message,
		Status:     "pendiente",
	}
	if err := h.DB.Create(&v).Error; err != nil {
		log.Printf("[Volunteer] Error al guardar: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "No se pudo registrar. Intenta de nuevo."})
	}

	log.Printf("[Volunteer] Inscripción: %s (%s) → %s", v.Name, v.Email, v.Department)
	return c.JSON(http.StatusCreated, map[string]interface{}{
		"message": "¡Gracias por tu interés! El equipo se comunicará contigo pronto.",
		"id":      v.ID,
	})
}

// GetDepartments GET /api/v1/volunteer/departments — público, lista de departamentos.
func (h *VolunteerHandler) GetDepartments(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]interface{}{
		"departments": Departments,
	})
}

// GetAll GET /api/v1/admin/volunteers — admin ve todos, leader solo los asignados.
func (h *VolunteerHandler) GetAll(c echo.Context) error {
	page, limit := parsePage(c)
	q := h.DB.Model(&models.Volunteer{}).Order("created_at DESC")

	if role, _ := c.Get("user_role").(string); role == "leader" {
		uid, _ := c.Get("user_id").(uint)
		q = q.Where("assigned_leader_id = ?", uid)
	}

	if dept := c.QueryParam("department"); dept != "" {
		q = q.Where("department = ?", dept)
	}
	if status := c.QueryParam("status"); status != "" {
		q = q.Where("status = ?", status)
	}

	var total int64
	q.Count(&total)

	offset := (page - 1) * limit
	var list []models.Volunteer
	if err := q.Offset(offset).Limit(limit).Find(&list).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al obtener voluntarios."})
	}
	return c.JSON(http.StatusOK, PagedResponse{Data: list, Meta: newMeta(total, page, limit)})
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

// GetMyInfo GET /api/v1/volunteer/me — retorna el registro de voluntario del usuario autenticado.
func (h *VolunteerHandler) GetMyInfo(c echo.Context) error {
	uid, _ := c.Get("user_id").(uint)

	// Obtener email del usuario desde la DB
	var user models.User
	if err := h.DB.First(&user, uid).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Usuario no encontrado."})
	}

	var v models.Volunteer
	if err := h.DB.Where("email = ?", user.Email).First(&v).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Sin registro de voluntario aún."})
	}

	// Nombre del líder asignado (para el apartado "Tu líder" del dashboard;
	// el frontend lo cruza con el directorio /leaders para foto y WhatsApp).
	resp := struct {
		models.Volunteer
		AssignedLeaderName string `json:"assigned_leader_name,omitempty"`
	}{Volunteer: v}
	if v.AssignedLeaderID != nil {
		var leader models.User
		if err := h.DB.Select("name").First(&leader, *v.AssignedLeaderID).Error; err == nil {
			resp.AssignedLeaderName = leader.Name
		}
	}
	return c.JSON(http.StatusOK, resp)
}

// CreateUserFromVolunteer POST /api/v1/admin/volunteers/:id/create-user
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
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al procesar la contraseña."})
	}

	verificationToken := uuid.New().String()
	verificationExpiry := time.Now().Add(24 * time.Hour)

	user := models.User{
		Name:                    v.Name,
		Email:                   v.Email,
		Password:                hashedPassword,
		Role:                    "volunteer",
		VerificationToken:       &verificationToken,
		VerificationTokenExpiry: &verificationExpiry,
	}
	if err := h.DB.Create(&user).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al crear el usuario."})
	}

	email.SendEmailAsync(
		user.Email,
		"Verifica tu correo — Casa del Rey",
		email.GetVerificationEmailTemplate(user.Name, verificationToken),
	)

	v.Status = "usuario_creado"
	h.DB.Save(&v)

	adminID, _ := c.Get("user_id").(uint)
	adminName, _ := c.Get("user_name").(string)
	LogActivity(h.DB, adminID, adminName, "approve", "volunteer", v.ID, v.Name, c.RealIP())

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"message": "Usuario creado. Se envió correo de verificación.",
		"user": map[string]interface{}{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
			"role":  user.Role,
		},
	})
}
