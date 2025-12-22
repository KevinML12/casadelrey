package handlers

import (
	"log"
	"strconv"

	"casadelrey/backend/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// BlogHandler maneja las operaciones de blog
type BlogHandler struct {
	DB *gorm.DB
}

// NewBlogHandler crea un nuevo handler de blog
func NewBlogHandler(db *gorm.DB) *BlogHandler {
	return &BlogHandler{DB: db}
}

// GetPublishedPosts lista todos los posts publicados
func (h *BlogHandler) GetPublishedPosts(c *fiber.Ctx) error {
	var posts []models.Post
	if result := h.DB.Where("status = ?", "published").Preload("Author").Order("created_at DESC").Find(&posts); result.Error != nil {
		log.Printf("Error al obtener posts: %v", result.Error)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error al obtener los posts",
		})
	}

	return c.Status(fiber.StatusOK).JSON(posts)
}

// GetPostBySlug obtiene un post por su slug
func (h *BlogHandler) GetPostBySlug(c *fiber.Ctx) error {
	slug := c.Params("slug")

	var post models.Post
	if result := h.DB.Where("slug = ? AND status = ?", slug, "published").Preload("Author").First(&post); result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Post no encontrado",
			})
		}
		log.Printf("Error al obtener post: %v", result.Error)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error al obtener el post",
		})
	}

	return c.Status(fiber.StatusOK).JSON(post)
}

// CreatePost crea un nuevo post (solo admin)
func (h *BlogHandler) CreatePost(c *fiber.Ctx) error {
	type CreatePostRequest struct {
		Title   string `json:"title" validate:"required"`
		Slug    string `json:"slug" validate:"required"`
		Content string `json:"content" validate:"required"`
		Status  string `json:"status" validate:"required,oneof=draft published"`
	}

	req := new(CreatePostRequest)
	if err := c.BodyParser(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Datos de entrada inválidos"})
	}

	// Validaciones
	if req.Title == "" || req.Slug == "" || req.Content == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Título, slug y contenido son requeridos",
		})
	}

	if req.Status != "draft" && req.Status != "published" {
		req.Status = "draft"
	}

	// Verificar que el slug no exista
	var existingPost models.Post
	if result := h.DB.Where("slug = ?", req.Slug).First(&existingPost); result.Error == nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Ya existe un post con ese slug",
		})
	}

	// Obtener el user_id del contexto (establecido por AuthMiddleware)
	userID, ok := c.Locals("user_id").(uint)
	if !ok {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "No se pudo obtener el ID de usuario"})
	}

	// Crear el post
	post := models.Post{
		Title:    req.Title,
		Slug:     req.Slug,
		Content:  req.Content,
		AuthorID: userID,
		Status:   req.Status,
	}

	if result := h.DB.Create(&post); result.Error != nil {
		log.Printf("Error al crear post: %v", result.Error)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error al crear el post",
		})
	}

	// Cargar el autor para devolverlo en la respuesta
	h.DB.Preload("Author").First(&post, post.ID)

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Post creado exitosamente",
		"post":    post,
	})
}

// UpdatePost actualiza un post existente (solo admin)
func (h *BlogHandler) UpdatePost(c *fiber.Ctx) error {
	type UpdatePostRequest struct {
		Title   string `json:"title"`
		Slug    string `json:"slug"`
		Content string `json:"content"`
		Status  string `json:"status" validate:"omitempty,oneof=draft published"`
	}

	postIDStr := c.Params("id")
	postID, err := strconv.ParseUint(postIDStr, 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "ID de post inválido"})
	}

	// Buscar el post
	var post models.Post
	if result := h.DB.First(&post, uint(postID)); result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Post no encontrado",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error al buscar el post",
		})
	}

	req := new(UpdatePostRequest)
	if err := c.BodyParser(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Datos de entrada inválidos"})
	}

	// Actualizar campos si se proporcionan
	if req.Title != "" {
		post.Title = req.Title
	}
	if req.Slug != "" {
		// Verificar que el nuevo slug no exista (excepto en este post)
		var existingPost models.Post
		if result := h.DB.Where("slug = ? AND id != ?", req.Slug, post.ID).First(&existingPost); result.Error == nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Ya existe otro post con ese slug",
			})
		}
		post.Slug = req.Slug
	}
	if req.Content != "" {
		post.Content = req.Content
	}
	if req.Status != "" {
		if req.Status == "draft" || req.Status == "published" {
			post.Status = req.Status
		}
	}

	// Guardar cambios
	if result := h.DB.Save(&post); result.Error != nil {
		log.Printf("Error al actualizar post: %v", result.Error)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error al actualizar el post",
		})
	}

	// Cargar el autor para devolverlo en la respuesta
	h.DB.Preload("Author").First(&post, post.ID)

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Post actualizado exitosamente",
		"post":    post,
	})
}

