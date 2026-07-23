package handlers

import (
	"net/http"

	"casadelrey/backend/auth"
	"casadelrey/backend/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// ProfileHandler maneja perfil y metas del usuario.
type ProfileHandler struct {
	DB *gorm.DB
}

func NewProfileHandler(db *gorm.DB) *ProfileHandler {
	return &ProfileHandler{DB: db}
}

// UpdateProfile PUT /api/v1/profile — el usuario edita su propio nombre/correo.
func (h *ProfileHandler) UpdateProfile(c echo.Context) error {
	uid, _ := c.Get("user_id").(uint)
	if uid == 0 {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "No autenticado."})
	}

	var req struct {
		Name  *string `json:"name"`
		Email *string `json:"email"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos inválidos."})
	}

	var user models.User
	if err := h.DB.First(&user, uid).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Usuario no encontrado."})
	}

	if req.Name != nil {
		if *req.Name == "" {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "El nombre no puede quedar vacío."})
		}
		user.Name = *req.Name
	}
	if req.Email != nil && *req.Email != user.Email {
		if *req.Email == "" {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "El correo no puede quedar vacío."})
		}
		var existing models.User
		if err := h.DB.Where("email = ? AND id <> ?", *req.Email, uid).First(&existing).Error; err == nil {
			return c.JSON(http.StatusConflict, map[string]string{"error": "Ese correo ya está en uso."})
		}
		user.Email = *req.Email
	}

	if err := h.DB.Save(&user).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "No se pudo actualizar el perfil."})
	}

	// El JWT lleva name/email en sus claims (ver AuthContext.jsx -- decodifica
	// el token en vez de pedirle el perfil al backend) -- sin reemitirlo, el
	// front seguiria mostrando el nombre/correo VIEJO hasta el proximo login.
	newToken, err := auth.GenerateJWT(user.ID, user.Name, user.Email, user.Role)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Perfil actualizado, pero no se pudo renovar la sesión."})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"token": newToken,
		"user":  map[string]interface{}{"id": user.ID, "name": user.Name, "email": user.Email, "role": user.Role},
	})
}

// ChangePassword PUT /api/v1/profile/password — el usuario cambia su propia
// contraseña, verificando la actual (a diferencia de ResetPassword, que es
// para cuando la olvidó y usa un token por correo).
func (h *ProfileHandler) ChangePassword(c echo.Context) error {
	uid, _ := c.Get("user_id").(uint)
	if uid == 0 {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "No autenticado."})
	}

	var req struct {
		CurrentPassword string `json:"current_password"`
		NewPassword     string `json:"new_password"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos inválidos."})
	}
	if len(req.NewPassword) < 6 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "La nueva contraseña debe tener mínimo 6 caracteres."})
	}

	var user models.User
	if err := h.DB.First(&user, uid).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Usuario no encontrado."})
	}

	if err := auth.ComparePassword(user.Password, req.CurrentPassword); err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "La contraseña actual es incorrecta."})
	}

	hashed, err := auth.HashPassword(req.NewPassword)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error interno al procesar la contraseña."})
	}
	user.Password = hashed
	if err := h.DB.Save(&user).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "No se pudo actualizar la contraseña."})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Contraseña actualizada correctamente."})
}

// GetGoals GET /api/v1/profile/goals — metas del usuario autenticado.
func (h *ProfileHandler) GetGoals(c echo.Context) error {
	uid, _ := c.Get("user_id").(uint)
	if uid == 0 {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "No autenticado."})
	}

	var goals []models.UserGoal
	if err := h.DB.Where("user_id = ?", uid).Order("created_at DESC").Find(&goals).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al obtener metas."})
	}
	return c.JSON(http.StatusOK, goals)
}

// CreateGoal POST /api/v1/profile/goals
func (h *ProfileHandler) CreateGoal(c echo.Context) error {
	uid, _ := c.Get("user_id").(uint)
	if uid == 0 {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "No autenticado."})
	}

	var req struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		TargetDate  string `json:"target_date"`
	}
	if err := c.Bind(&req); err != nil || req.Title == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "El título es requerido."})
	}

	g := models.UserGoal{
		UserID:      uid,
		Title:       req.Title,
		Description: req.Description,
		TargetDate:  req.TargetDate,
	}
	if err := h.DB.Create(&g).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al crear la meta."})
	}
	return c.JSON(http.StatusCreated, g)
}

// UpdateGoal PUT /api/v1/profile/goals/:id
func (h *ProfileHandler) UpdateGoal(c echo.Context) error {
	uid, _ := c.Get("user_id").(uint)
	if uid == 0 {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "No autenticado."})
	}

	id := c.Param("id")
	var req struct {
		Title       *string `json:"title"`
		Description *string `json:"description"`
		TargetDate  *string `json:"target_date"`
		Completed   *bool   `json:"completed"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos inválidos."})
	}

	var g models.UserGoal
	if err := h.DB.Where("id = ? AND user_id = ?", id, uid).First(&g).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Meta no encontrada."})
	}

	updates := make(map[string]interface{})
	if req.Title != nil {
		updates["title"] = *req.Title
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.TargetDate != nil {
		updates["target_date"] = *req.TargetDate
	}
	if req.Completed != nil {
		updates["completed"] = *req.Completed
	}

	if len(updates) > 0 {
		h.DB.Model(&g).Updates(updates)
		h.DB.Where("id = ?", g.ID).First(&g)
	}
	return c.JSON(http.StatusOK, g)
}

// DeleteGoal DELETE /api/v1/profile/goals/:id
func (h *ProfileHandler) DeleteGoal(c echo.Context) error {
	uid, _ := c.Get("user_id").(uint)
	if uid == 0 {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "No autenticado."})
	}

	id := c.Param("id")
	result := h.DB.Where("id = ? AND user_id = ?", id, uid).Delete(&models.UserGoal{})
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al eliminar."})
	}
	if result.RowsAffected == 0 {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Meta no encontrada."})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Meta eliminada."})
}
