package handlers

import (
	"log"
	"net/http"

	"casa-del-rey/backend/auth"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// Post representa el modelo de post de blog
type Post struct {
	gorm.Model
	Title    string    `json:"title" gorm:"not null"`
	Slug     string    `json:"slug" gorm:"unique;not null"`
	Content  string    `json:"content" gorm:"type:text;not null"`
	AuthorID uint      `json:"author_id" gorm:"not null"`
	Status   string    `json:"status" gorm:"default:draft"`
	Author   auth.User `json:"author" gorm:"foreignKey:AuthorID"`
}

// BlogHandler maneja las operaciones de blog
type BlogHandler struct {
	DB *gorm.DB
}

// NewBlogHandler crea un nuevo handler de blog
func NewBlogHandler(db *gorm.DB) *BlogHandler {
	return &BlogHandler{DB: db}
}

// GetPublishedPosts lista todos los posts publicados
func (h *BlogHandler) GetPublishedPosts(c echo.Context) error {
	var posts []Post
	if result := h.DB.Where("status = ?", "published").Preload("Author").Order("created_at DESC").Find(&posts); result.Error != nil {
		log.Printf("Error al obtener posts: %v", result.Error)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Error al obtener los posts",
		})
	}

	return c.JSON(http.StatusOK, posts)
}

// GetPostBySlug obtiene un post por su slug
func (h *BlogHandler) GetPostBySlug(c echo.Context) error {
	slug := c.Param("slug")

	var post Post
	if result := h.DB.Where("slug = ? AND status = ?", slug, "published").Preload("Author").First(&post); result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "Post no encontrado",
			})
		}
		log.Printf("Error al obtener post: %v", result.Error)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Error al obtener el post",
		})
	}

	return c.JSON(http.StatusOK, post)
}

// CreatePost crea un nuevo post (solo admin)
func (h *BlogHandler) CreatePost(c echo.Context) error {
	type CreatePostRequest struct {
		Title   string `json:"title" validate:"required"`
		Slug    string `json:"slug" validate:"required"`
		Content string `json:"content" validate:"required"`
		Status  string `json:"status" validate:"required,oneof=draft published"`
	}

	req := new(CreatePostRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos de entrada inválidos"})
	}

	// Validaciones
	if req.Title == "" || req.Slug == "" || req.Content == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Título, slug y contenido son requeridos",
		})
	}

	if req.Status != "draft" && req.Status != "published" {
		req.Status = "draft"
	}

	// Verificar que el slug no exista
	var existingPost Post
	if result := h.DB.Where("slug = ?", req.Slug).First(&existingPost); result.Error == nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Ya existe un post con ese slug",
		})
	}

	// Obtener el user_id del contexto (establecido por AuthMiddleware)
	userID := c.Get("user_id").(uint)

	// Crear el post
	post := Post{
		Title:    req.Title,
		Slug:     req.Slug,
		Content:  req.Content,
		AuthorID: userID,
		Status:   req.Status,
	}

	if result := h.DB.Create(&post); result.Error != nil {
		log.Printf("Error al crear post: %v", result.Error)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Error al crear el post",
		})
	}

	// Cargar el autor para devolverlo en la respuesta
	h.DB.Preload("Author").First(&post, post.ID)

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"message": "Post creado exitosamente",
		"post":    post,
	})
}

// UpdatePost actualiza un post existente (solo admin)
func (h *BlogHandler) UpdatePost(c echo.Context) error {
	type UpdatePostRequest struct {
		Title   string `json:"title"`
		Slug    string `json:"slug"`
		Content string `json:"content"`
		Status  string `json:"status" validate:"omitempty,oneof=draft published"`
	}

	postID := c.Param("id")

	// Buscar el post
	var post Post
	if result := h.DB.First(&post, postID); result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "Post no encontrado",
			})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Error al buscar el post",
		})
	}

	req := new(UpdatePostRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos de entrada inválidos"})
	}

	// Actualizar campos si se proporcionan
	if req.Title != "" {
		post.Title = req.Title
	}
	if req.Slug != "" {
		// Verificar que el nuevo slug no exista (excepto en este post)
		var existingPost Post
		if result := h.DB.Where("slug = ? AND id != ?", req.Slug, post.ID).First(&existingPost); result.Error == nil {
			return c.JSON(http.StatusBadRequest, map[string]string{
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
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Error al actualizar el post",
		})
	}

	// Cargar el autor para devolverlo en la respuesta
	h.DB.Preload("Author").First(&post, post.ID)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message": "Post actualizado exitosamente",
		"post":    post,
	})
}
