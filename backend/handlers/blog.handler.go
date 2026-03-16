package handlers

import (
	"log"
	"net/http"
	"strconv"

	"casadelrey/backend/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// BlogHandler maneja las operaciones CRUD sobre los posts del blog.
type BlogHandler struct {
	DB *gorm.DB
}

// NewBlogHandler crea una nueva instancia del handler de blog.
func NewBlogHandler(db *gorm.DB) *BlogHandler {
	return &BlogHandler{DB: db}
}

// GetPublishedPosts godoc
// GET /api/v1/blog
// Retorna todos los posts con status "published", ordenados por fecha desc.
func (h *BlogHandler) GetPublishedPosts(c echo.Context) error {
	var posts []models.Post
	result := h.DB.
		Where("status = ?", "published").
		Preload("Author").
		Order("created_at DESC").
		Find(&posts)

	if result.Error != nil {
		log.Printf("[Blog] Error al obtener posts: %v", result.Error)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Error al obtener los posts.",
		})
	}

	return c.JSON(http.StatusOK, posts)
}

// GetPostBySlug godoc
// GET /api/v1/blog/:slug
// Retorna un post publicado por su slug único.
func (h *BlogHandler) GetPostBySlug(c echo.Context) error {
	slug := c.Param("slug")

	var post models.Post
	result := h.DB.
		Where("slug = ? AND status = ?", slug, "published").
		Preload("Author").
		First(&post)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "Post no encontrado.",
			})
		}
		log.Printf("[Blog] Error al obtener post '%s': %v", slug, result.Error)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Error al obtener el post.",
		})
	}

	h.DB.Model(&post).UpdateColumn("view_count", gorm.Expr("view_count + 1"))
	post.ViewCount++

	return c.JSON(http.StatusOK, post)
}

// GetAllPosts godoc
// GET /api/v1/admin/blog/  [Requiere auth + rol admin]
// Retorna TODOS los posts (borradores y publicados), para el panel de administración.
func (h *BlogHandler) GetAllPosts(c echo.Context) error {
	var posts []models.Post
	result := h.DB.
		Preload("Author").
		Order("created_at DESC").
		Find(&posts)

	if result.Error != nil {
		log.Printf("[Blog] Error al obtener posts (admin): %v", result.Error)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Error al obtener los posts.",
		})
	}

	return c.JSON(http.StatusOK, posts)
}

// CreatePost godoc
// POST /api/v1/admin/blog  [Requiere auth + rol admin]
// Crea un nuevo post de blog. El author_id se toma del JWT, no del body.
func (h *BlogHandler) CreatePost(c echo.Context) error {
	type CreatePostRequest struct {
		Title      string `json:"title"`
		Slug       string `json:"slug"`
		Content    string `json:"content"`
		CoverImage string `json:"cover_image"`
		Excerpt    string `json:"excerpt"`
		Status     string `json:"status"` // "draft" | "published"
	}

	req := new(CreatePostRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Datos de entrada inválidos.",
		})
	}

	if req.Title == "" || req.Slug == "" || req.Content == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Título, slug y contenido son requeridos.",
		})
	}

	if req.Status != "draft" && req.Status != "published" {
		req.Status = "draft"
	}

	var existing models.Post
	if result := h.DB.Where("slug = ?", req.Slug).First(&existing); result.Error == nil {
		return c.JSON(http.StatusConflict, map[string]string{
			"error": "Ya existe un post con ese slug.",
		})
	}

	userID, ok := c.Get("user_id").(uint)
	if !ok {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "No se pudo identificar al autor del post.",
		})
	}

	post := models.Post{
		Title:      req.Title,
		Slug:       req.Slug,
		Content:    req.Content,
		CoverImage: req.CoverImage,
		Excerpt:    req.Excerpt,
		AuthorID:   userID,
		Status:     req.Status,
	}

	if result := h.DB.Create(&post); result.Error != nil {
		log.Printf("[Blog] Error al crear post: %v", result.Error)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Error al crear el post.",
		})
	}

	h.DB.Preload("Author").First(&post, post.ID)

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"message": "Post creado exitosamente.",
		"post":    post,
	})
}

// UpdatePost godoc
// PUT /api/v1/admin/blog/:id  [Requiere auth + rol admin]
// Actualiza los campos de un post existente. Solo actualiza los campos enviados.
func (h *BlogHandler) UpdatePost(c echo.Context) error {
	type UpdatePostRequest struct {
		Title      string `json:"title"`
		Slug       string `json:"slug"`
		Content    string `json:"content"`
		CoverImage string `json:"cover_image"`
		Excerpt    string `json:"excerpt"`
		Status     string `json:"status"`
	}

	// Parsear el ID del post desde la URL
	postID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "ID de post inválido.",
		})
	}

	var post models.Post
	if result := h.DB.First(&post, uint(postID)); result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "Post no encontrado.",
			})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Error al buscar el post.",
		})
	}

	req := new(UpdatePostRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Datos de entrada inválidos.",
		})
	}

	if req.Title != "" {
		post.Title = req.Title
	}
	if req.Content != "" {
		post.Content = req.Content
	}
	if req.Status == "draft" || req.Status == "published" {
		post.Status = req.Status
	}
	// Siempre actualizar cover_image y excerpt (pueden ser cadena vacía para borrar)
	post.CoverImage = req.CoverImage
	post.Excerpt    = req.Excerpt

	if req.Slug != "" && req.Slug != post.Slug {
		var other models.Post
		if result := h.DB.Where("slug = ? AND id != ?", req.Slug, post.ID).First(&other); result.Error == nil {
			return c.JSON(http.StatusConflict, map[string]string{
				"error": "Ya existe otro post con ese slug.",
			})
		}
		post.Slug = req.Slug
	}

	if result := h.DB.Save(&post); result.Error != nil {
		log.Printf("[Blog] Error al actualizar post %d: %v", postID, result.Error)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Error al actualizar el post.",
		})
	}

	h.DB.Preload("Author").First(&post, post.ID)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message": "Post actualizado exitosamente.",
		"post":    post,
	})
}

// DeletePost godoc
// DELETE /api/v1/admin/blog/:id  [Requiere auth + rol admin]
func (h *BlogHandler) DeletePost(c echo.Context) error {
	postID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID inválido."})
	}

	var post models.Post
	if result := h.DB.First(&post, uint(postID)); result.Error != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Post no encontrado."})
	}

	if result := h.DB.Delete(&post); result.Error != nil {
		log.Printf("[Blog] Error al eliminar post %d: %v", postID, result.Error)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al eliminar el post."})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "Post eliminado."})
}
