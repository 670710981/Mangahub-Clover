package models

import "time"

type User struct {
	ID           int       `json:"id"`
	AnilistID    *int      `json:"anilist_id"`
	Username     string    `json:"username"`
	Email        *string   `json:"email"`
	AvatarURL    *string   `json:"avatar_url"`
	Role         string    `json:"role"`
	PasswordHash string    `json:"-"` // ไม่ส่งรหัสผ่านกลับไปหน้าบ้าน
	CreatedAt    time.Time `json:"created_at"`
}

type Manga struct {
	ID          int       `json:"id"`
	Title       string    `json:"title"`
	Author      *string   `json:"author"`
	Genre       *string   `json:"genre"`
	Status      string    `json:"status"`
	Synopsis    *string   `json:"synopsis"`
	CoverURL    *string   `json:"cover_url"`
	AvgRating   float64   `json:"avg_rating"`
	ReviewCount int       `json:"review_count"`
	CreatedAt   time.Time `json:"created_at"`
}

type Review struct {
	ID        int       `json:"id"`
	MangaID   int       `json:"manga_id"`
	UserID    int       `json:"user_id"`
	Username  string    `json:"username"`
	AvatarURL *string   `json:"avatar_url"`
	Rating    int       `json:"rating"`
	Comment   *string   `json:"comment"`
	CreatedAt time.Time `json:"created_at"`
}

type Favorite struct {
	ID         int       `json:"id"`
	UserID     int       `json:"user_id"`
	MangaID    string    `json:"manga_id"`
	MangaTitle string    `json:"manga_title"`
	CoverImage *string   `json:"cover_image"`
	CreatedAt  time.Time `json:"created_at"`
}