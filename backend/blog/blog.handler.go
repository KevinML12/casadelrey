package blog

import (
	"log"
	"net/http"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// Handler maneja las operaciones CRUD de blog
type Handler struct {
	DB *gorm.DB
}

// NewHandler crea un nuevo handler de blog
func NewHandler(db *gorm.DB) *Handler {
	return &Handler{DB: db}
}

// GetPublicPosts devuelve todos los posts publicados
// GET /api/blog/posts
func (h *Handler) GetPublicPosts(c echo.Context) error {
	var posts []Post

	result := h.DB.Where("status = ?", "published").
		Preload("Author").
		Order("created_at DESC").
		Find(&posts)

	if result.Error != nil {
		log.Printf("Error al obtener posts: %v", result.Error)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Error al obtener los posts",
		})
	}

	return c.JSON(http.StatusOK, posts)
}

// GetPostBySlug obtiene un post publicado por su slug
// GET /api/blog/posts/:slug
func (h *Handler) GetPostBySlug(c echo.Context) error {
	slug := c.Param("slug")

	var post Post
	result := h.DB.Where("slug = ? AND status = ?", slug, "published").
		Preload("Author").
		First(&post)

	if result.Error != nil {
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
// POST /api/admin/blog
func (h *Handler) CreatePost(c echo.Context) error {
	type CreatePostRequest struct {
		Title   string `json:"title" validate:"required"`
		Slug    string `json:"slug" validate:"required"`
		Content string `json:"content" validate:"required"`
		Status  string `json:"status" validate:"required,oneof=draft published"`
	}

	req := new(CreatePostRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Datos de entrada inválidos",
		})
	}

	// Validar con el validador registrado
	if err := c.Validate(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": err.Error(),
		})
	}

	// Verificar que el slug no exista
	var existingPost Post
	if result := h.DB.Where("slug = ?", req.Slug).First(&existingPost); result.Error == nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Ya existe un post con ese slug",
		})
	}

	// Obtener el user_id del contexto (establecido por AuthMiddleware)
	userID, ok := c.Get("user_id").(uint)
	if !ok {
		return c.JSON(http.StatusUnauthorized, map[string]string{
			"error": "Usuario no autenticado",
		})
	}

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
// PUT /api/admin/blog/:id
func (h *Handler) UpdatePost(c echo.Context) error {
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
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Datos de entrada inválidos",
		})
	}

	// Validar con el validador registrado
	if err := c.Validate(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": err.Error(),
		})
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
