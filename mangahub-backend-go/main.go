package main

import (
	"context"
	"log"
	"os"
	"time"

	"mangahub-backend-go/config"
	"mangahub-backend-go/handlers"
	"mangahub-backend-go/middleware"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()
	config.ConnectDB()
	defer config.DB.Close()

	app := fiber.New()
	app.Use(cors.New(cors.Config{
		AllowOrigins: "https://mangahub-clover-rho.vercel.app, http://localhost:3000",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	// Health Check
	app.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"message": "Welcome to MangaHub Go API"})
	})
	app.Get("/api/health", func(c *fiber.Ctx) error {
		var now time.Time
		config.DB.QueryRow(context.Background(), "SELECT NOW()").Scan(&now)
		return c.JSON(fiber.Map{"status": "ok", "db_time": now})
	})

	api := app.Group("/api")

	// Auth Routes
	api.Post("/auth/register", handlers.Register)
	api.Post("/auth/login", handlers.Login)
	api.Post("/auth/dev-login", handlers.DevLogin)
	api.Post("/auth/anilist", handlers.AnilistLogin)
	api.Get("/auth/me", middleware.AuthenticateToken, handlers.GetMe)
	api.Put("/auth/change-password", middleware.AuthenticateToken, handlers.ChangePassword)

	// Manga Routes (Guest อ่านได้ / Admin เพิ่มได้)
	api.Get("/mangas", handlers.GetMangas)
	api.Get("/mangas/:id", handlers.GetMangaByID)
	api.Post("/mangas", middleware.AuthenticateToken, middleware.RequireAdmin, handlers.CreateManga)

	// Review Routes
	api.Get("/manga/:id/reviews", handlers.GetReviews)
	api.Post("/manga/:id/reviews", middleware.AuthenticateToken, handlers.PostReview)

	// Favorite Routes
	api.Get("/favorites", middleware.AuthenticateToken, handlers.GetFavorites)
	api.Post("/favorites", middleware.AuthenticateToken, handlers.AddFavorite)
	api.Delete("/favorites/:mangaId", middleware.AuthenticateToken, handlers.RemoveFavorite)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Fatal(app.Listen(":" + port))
}