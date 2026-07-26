package handlers

import (
	"net/http"
	"strconv"

	"casadelrey/backend/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// DonationPurposeHandler administra los destinos de donación (Fondo
// General, Células, Misiones...). Antes vivían hardcodeados en DOS
// arreglos desincronizados del frontend (IMPACT en DonatePage.jsx,
// PURPOSES en DonationCard.jsx) -- mismo patrón que VolunteerArea.
type DonationPurposeHandler struct {
	DB *gorm.DB
}

func NewDonationPurposeHandler(db *gorm.DB) *DonationPurposeHandler {
	return &DonationPurposeHandler{DB: db}
}

// GetPublicDonationPurposes GET /api/v1/donation-purposes — público, solo
// destinos activos, ordenados como el admin los definió.
func (h *DonationPurposeHandler) GetPublicDonationPurposes(c echo.Context) error {
	var purposes []models.DonationPurpose
	if err := h.DB.Where("is_active = ?", true).Order("sort_order, title").Find(&purposes).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al obtener destinos."})
	}
	return c.JSON(http.StatusOK, purposes)
}

// GetAllDonationPurposesAdmin GET /api/v1/admin/donation-purposes — admin
// ve todos, incluidos los inactivos.
func (h *DonationPurposeHandler) GetAllDonationPurposesAdmin(c echo.Context) error {
	var purposes []models.DonationPurpose
	if err := h.DB.Order("sort_order, title").Find(&purposes).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al obtener destinos."})
	}
	return c.JSON(http.StatusOK, purposes)
}

// CreateDonationPurpose POST /api/v1/admin/donation-purposes — admin.
func (h *DonationPurposeHandler) CreateDonationPurpose(c echo.Context) error {
	var purpose models.DonationPurpose
	if err := c.Bind(&purpose); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos inválidos."})
	}
	if purpose.Value == "" || purpose.Title == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Value y título son obligatorios."})
	}
	purpose.IsActive = true
	if err := h.DB.Create(&purpose).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al crear. ¿Ya existe ese value?"})
	}
	return c.JSON(http.StatusCreated, purpose)
}

// UpdateDonationPurpose PUT /api/v1/admin/donation-purposes/:id — admin.
func (h *DonationPurposeHandler) UpdateDonationPurpose(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID inválido."})
	}
	var purpose models.DonationPurpose
	if err := h.DB.First(&purpose, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Destino no encontrado."})
	}

	var req struct {
		Value       string `json:"value"`
		Icon        string `json:"icon"`
		Title       string `json:"title"`
		Description string `json:"description"`
		SortOrder   *int   `json:"sort_order"`
		IsActive    *bool  `json:"is_active"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos inválidos."})
	}
	if req.Value != "" {
		purpose.Value = req.Value
	}
	if req.Title != "" {
		purpose.Title = req.Title
	}
	purpose.Icon = req.Icon
	purpose.Description = req.Description
	if req.SortOrder != nil {
		purpose.SortOrder = *req.SortOrder
	}
	if req.IsActive != nil {
		purpose.IsActive = *req.IsActive
	}

	if err := h.DB.Save(&purpose).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al guardar."})
	}
	return c.JSON(http.StatusOK, purpose)
}

// DeleteDonationPurpose DELETE /api/v1/admin/donation-purposes/:id — admin,
// soft-delete (is_active=false) -- no se borra de verdad para no romper
// donaciones ya registradas con ese destino.
func (h *DonationPurposeHandler) DeleteDonationPurpose(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID inválido."})
	}
	if err := h.DB.Model(&models.DonationPurpose{}).Where("id = ?", id).Update("is_active", false).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al eliminar."})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Destino eliminado."})
}
