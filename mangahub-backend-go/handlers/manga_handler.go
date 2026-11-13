package handlers

import (
	"context"
	"mangahub-backend-go/config"
	"mangahub-backend-go/models"

	"github.com/gofiber/fiber/v2"
)

// GET /api/mangas
func GetMangas(c *fiber.Ctx) error {
	search := "%" + c.Query("search", "") + "%"
	genre := "%" + c.Query("genre", "") + "%"

	page := c.QueryInt("page", 1)
	perPage := c.QueryInt("perPage", 30)
	if page < 1 {
		page = 1
	}
	if perPage < 1 {
		perPage = 30
	}
	if perPage > 100 {
		perPage = 100
	}
	rows, err := config.DB.Query(context.Background(),
		`SELECT m.id, COALESCE(m.anilist_id, m.id), m.title, m.author, m.genre, m.status, m.synopsis, m.cover_url, m.score, m.chapters, m.created_at,
		        COALESCE(ROUND(AVG(r.rating), 1), 0)::float8 AS avg_rating,
		        COUNT(r.id)::int AS review_count
		 FROM mangas m
		 LEFT JOIN reviews r ON m.id = r.manga_id
		 WHERE m.title ILIKE $1 AND COALESCE(m.genre, '') ILIKE $2
		 GROUP BY m.id
			 ORDER BY m.id DESC LIMIT $3 OFFSET $4`, search, genre, perPage+1, (page-1)*perPage)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "ดึงข้อมูลล้มเหลว", "error": err.Error()})
	}
	defer rows.Close()

	mangas := []models.Manga{}
	hasNext := false
	for rows.Next() {
		var m models.Manga
		rows.Scan(&m.ID, &m.AnilistID, &m.Title, &m.Author, &m.Genre, &m.Status, &m.Synopsis, &m.CoverURL, &m.Score, &m.Chapters, &m.CreatedAt, &m.AvgRating, &m.ReviewCount)
		if len(mangas) == perPage {
			hasNext = true
			break
		}
		mangas = append(mangas, m)
	}
	return c.JSON(fiber.Map{"items": mangas, "has_next": hasNext})
}

// GET /api/genres
func GetGenres(c *fiber.Ctx) error {
	rows, err := config.DB.Query(context.Background(), `SELECT DISTINCT trim(g) FROM mangas, unnest(string_to_array(COALESCE(genre,''), ',')) AS g WHERE trim(g) <> '' ORDER BY 1`)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "ดึงประเภทมังงะไม่สำเร็จ"})
	}
	defer rows.Close()
	genres := []string{}
	for rows.Next() {
		var g string
		if rows.Scan(&g) == nil {
			genres = append(genres, g)
		}
	}
	return c.JSON(genres)
}

// GET /api/mangas/:id
func GetMangaByID(c *fiber.Ctx) error {
	id := c.Params("id")
	var m models.Manga
	err := config.DB.QueryRow(context.Background(),
		`SELECT id, COALESCE(anilist_id, id), title, author, genre, status, synopsis, cover_url, score, chapters, created_at FROM mangas WHERE COALESCE(anilist_id, id) = $1`, id,
	).Scan(&m.ID, &m.AnilistID, &m.Title, &m.Author, &m.Genre, &m.Status, &m.Synopsis, &m.CoverURL, &m.Score, &m.Chapters, &m.CreatedAt)

	if err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "ไม่พบมังงะ"})
	}
	return c.JSON(m)
}

// POST /api/mangas (เฉพาะ Admin)
func CreateManga(c *fiber.Ctx) error {
	var body models.Manga
	if err := c.BodyParser(&body); err != nil || body.Title == "" {
		return c.Status(400).JSON(fiber.Map{"message": "ข้อมูลไม่ครบถ้วน"})
	}
	if body.Status == "" {
		body.Status = "Ongoing"
	}

	err := config.DB.QueryRow(context.Background(),
		`INSERT INTO mangas (title, author, genre, status, synopsis, cover_url)
		 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, created_at`,
		body.Title, body.Author, body.Genre, body.Status, body.Synopsis, body.CoverURL,
	).Scan(&body.ID, &body.CreatedAt)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "เพิ่มมังงะไม่สำเร็จ", "error": err.Error()})
	}
	return c.Status(201).JSON(body)
}

// GET /api/manga/:id/reviews
func GetReviews(c *fiber.Ctx) error {
	mangaID := c.Params("id")
	rows, err := config.DB.Query(context.Background(),
		`SELECT r.id, r.manga_id, r.rating, r.comment, r.created_at, u.username, u.avatar_url
		 FROM reviews r JOIN users u ON r.user_id = u.id
		 WHERE r.manga_id = (SELECT id FROM mangas WHERE COALESCE(anilist_id, id) = $1)
		 ORDER BY r.created_at DESC`, mangaID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"status": "error", "message": "Failed to fetch reviews"})
	}
	defer rows.Close()

	reviews := []models.Review{}
	for rows.Next() {
		var r models.Review
		rows.Scan(&r.ID, &r.MangaID, &r.Rating, &r.Comment, &r.CreatedAt, &r.Username, &r.AvatarURL)
		reviews = append(reviews, r)
	}

	var avg float64
	var total int
	config.DB.QueryRow(context.Background(),
		`SELECT COALESCE(AVG(rating), 0)::float8, COUNT(id)::int FROM reviews WHERE manga_id = $1`, mangaID,
	).Scan(&avg, &total)

	return c.JSON(fiber.Map{
		"status": "success",
		"data": fiber.Map{
			"summary": fiber.Map{"average_rating": avg, "total_reviews": total},
			"reviews": reviews,
		},
	})
}

// POST /api/manga/:id/reviews
func PostReview(c *fiber.Ctx) error {
	mangaID := c.Params("id")
	userID := c.Locals("user_id").(int)
	var localMangaID int
	if err := config.DB.QueryRow(context.Background(), `SELECT id FROM mangas WHERE COALESCE(anilist_id, id) = $1`, mangaID).Scan(&localMangaID); err != nil {
		return c.Status(404).JSON(fiber.Map{"status": "error", "message": "Manga not found"})
	}
	var body struct {
		Rating  int    `json:"rating"`
		Comment string `json:"comment"`
	}
	if err := c.BodyParser(&body); err != nil || body.Rating < 1 || body.Rating > 10 {
		return c.Status(400).JSON(fiber.Map{"status": "error", "message": "Rating must be between 1 and 10"})
	}

	var rev models.Review
	err := config.DB.QueryRow(context.Background(),
		`INSERT INTO reviews (user_id, manga_id, rating, comment, updated_at)
		 VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
		 ON CONFLICT (user_id, manga_id)
		 DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, updated_at = CURRENT_TIMESTAMP
		 RETURNING id, manga_id, user_id, rating, comment, created_at`,
		userID, localMangaID, body.Rating, body.Comment,
	).Scan(&rev.ID, &rev.MangaID, &rev.UserID, &rev.Rating, &rev.Comment, &rev.CreatedAt)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"status": "error", "message": "Failed to submit review"})
	}
	return c.Status(201).JSON(fiber.Map{"status": "success", "message": "Review submitted successfully", "data": rev})
}

// GET /api/favorites
func GetFavorites(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int)
	rows, err := config.DB.Query(context.Background(),
		`SELECT id, manga_id, manga_title, cover_image, created_at FROM favorites WHERE user_id = $1 ORDER BY created_at DESC`, userID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"status": "error", "message": "Failed to fetch favorites"})
	}
	defer rows.Close()

	favs := []models.Favorite{}
	for rows.Next() {
		var f models.Favorite
		rows.Scan(&f.ID, &f.MangaID, &f.MangaTitle, &f.CoverImage, &f.CreatedAt)
		favs = append(favs, f)
	}
	return c.JSON(fiber.Map{"status": "success", "data": favs})
}

// POST /api/favorites
func AddFavorite(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int)
	var body models.Favorite
	if err := c.BodyParser(&body); err != nil || body.MangaID == "" || body.MangaTitle == "" {
		return c.Status(400).JSON(fiber.Map{"status": "error", "message": "Manga ID and Title are required"})
	}

	err := config.DB.QueryRow(context.Background(),
		`INSERT INTO favorites (user_id, manga_id, manga_title, cover_image)
		 VALUES ($1, $2, $3, $4)
		 ON CONFLICT (user_id, manga_id) DO NOTHING
		 RETURNING id, created_at`,
		userID, body.MangaID, body.MangaTitle, body.CoverImage,
	).Scan(&body.ID, &body.CreatedAt)

	if err != nil {
		return c.Status(409).JSON(fiber.Map{"status": "error", "message": "Manga already in favorites"})
	}
	body.UserID = userID
	return c.Status(201).JSON(fiber.Map{"status": "success", "data": body})
}

// DELETE /api/favorites/:mangaId
func RemoveFavorite(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int)
	mangaID := c.Params("mangaId")

	tag, err := config.DB.Exec(context.Background(),
		`DELETE FROM favorites WHERE user_id = $1 AND manga_id = $2`, userID, mangaID)
	if err != nil || tag.RowsAffected() == 0 {
		return c.Status(404).JSON(fiber.Map{"status": "error", "message": "Favorite item not found"})
	}
	return c.JSON(fiber.Map{"status": "success", "message": "Removed from favorites"})
}
