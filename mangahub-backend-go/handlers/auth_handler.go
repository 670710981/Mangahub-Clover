package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"os"
	"time"

	"mangahub-backend-go/config"
	"mangahub-backend-go/models"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

func generateToken(user models.User) (string, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "supersecretkey123"
	}
	claims := jwt.MapClaims{
		"id":       user.ID,
		"username": user.Username,
		"role":     user.Role,
		"exp":      time.Now().Add(time.Hour * 24 * 7).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// 1. Register (สมัครสมาชิกด้วย Email + Password)
func Register(c *fiber.Ctx) error {
	var body struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.BodyParser(&body); err != nil || body.Email == "" || body.Password == "" {
		return c.Status(400).JSON(fiber.Map{"status": "error", "message": "กรุณากรอกข้อมูลให้ครบ"})
	}

	hash, _ := bcrypt.GenerateFromPassword([]byte(body.Password), 10)
	var user models.User
	err := config.DB.QueryRow(context.Background(),
		`INSERT INTO users (username, email, password_hash, role) 
		 VALUES ($1, $2, $3, 'member') 
		 RETURNING id, username, email, role, created_at`,
		body.Username, body.Email, string(hash),
	).Scan(&user.ID, &user.Username, &user.Email, &user.Role, &user.CreatedAt)

	if err != nil {
		return c.Status(409).JSON(fiber.Map{"status": "error", "message": "อีเมลหรือชื่อผู้ใช้นี้ถูกใช้งานแล้ว"})
	}

	token, _ := generateToken(user)
	return c.Status(201).JSON(fiber.Map{"status": "success", "token": token, "user": user})
}

// 2. Login (ล็อกอินด้วย Email + Password)
func Login(c *fiber.Ctx) error {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"status": "error", "message": "Invalid request"})
	}

	var user models.User
	var passHash *string
	err := config.DB.QueryRow(context.Background(),
		`SELECT id, username, email, password_hash, role, avatar_url, created_at FROM users WHERE email = $1`,
		body.Email,
	).Scan(&user.ID, &user.Username, &user.Email, &passHash, &user.Role, &user.AvatarURL, &user.CreatedAt)

	if err != nil || passHash == nil || bcrypt.CompareHashAndPassword([]byte(*passHash), []byte(body.Password)) != nil {
		return c.Status(401).JSON(fiber.Map{"status": "error", "message": "อีเมลหรือรหัสผ่านไม่ถูกต้อง"})
	}

	token, _ := generateToken(user)
	return c.JSON(fiber.Map{"status": "success", "token": token, "user": user})
}

// 3. Dev Login (เหมือน Express เดิม)
func DevLogin(c *fiber.Ctx) error {
	var body struct {
		Username string `json:"username"`
		Email    string `json:"email"`
	}
	c.BodyParser(&body)
	if body.Username == "" {
		body.Username = "testuser"
	}
	if body.Email == "" {
		body.Email = "test@mangahub.com"
	}

	var user models.User
	err := config.DB.QueryRow(context.Background(),
		`INSERT INTO users (username, email, avatar_url, role)
		 VALUES ($1, $2, 'https://via.placeholder.com/150', 'member')
		 ON CONFLICT (email) DO UPDATE SET username = EXCLUDED.username
		 RETURNING id, username, email, avatar_url, role`,
		body.Username, body.Email,
	).Scan(&user.ID, &user.Username, &user.Email, &user.AvatarURL, &user.Role)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"status": "error", "message": "Dev login failed"})
	}

	token, _ := generateToken(user)
	return c.JSON(fiber.Map{"status": "success", "token": token, "user": user})
}

// 4. AniList OAuth Login (เหมือน Express เดิม)
func AnilistLogin(c *fiber.Ctx) error {
	var body struct {
		Code string `json:"code"`
	}
	if err := c.BodyParser(&body); err != nil || body.Code == "" {
		return c.Status(400).JSON(fiber.Map{"status": "error", "message": "Authorization code is required"})
	}

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}

	tokenPayload, _ := json.Marshal(map[string]string{
		"grant_type":    "authorization_code",
		"client_id":     os.Getenv("ANILIST_CLIENT_ID"),
		"client_secret": os.Getenv("ANILIST_CLIENT_SECRET"),
		"redirect_uri":  frontendURL + "/auth/callback",
		"code":          body.Code,
	})

	resp, err := http.Post("https://anilist.co/api/v2/oauth/token", "application/json", bytes.NewBuffer(tokenPayload))
	if err != nil || resp.StatusCode != 200 {
		return c.Status(401).JSON(fiber.Map{"status": "error", "message": "AniList token exchange failed"})
	}
	defer resp.Body.Close()

	var tokenData struct {
		AccessToken string `json:"access_token"`
	}
	json.NewDecoder(resp.Body).Decode(&tokenData)

	gqlPayload, _ := json.Marshal(map[string]string{
		"query": "query { Viewer { id name avatar { large } } }",
	})
	req, _ := http.NewRequest("POST", "https://graphql.anilist.co", bytes.NewBuffer(gqlPayload))
	req.Header.Set("Authorization", "Bearer "+tokenData.AccessToken)
	req.Header.Set("Content-Type", "application/json")

	userResp, err := http.DefaultClient.Do(req)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{"status": "error", "message": "Failed to fetch AniList user"})
	}
	defer userResp.Body.Close()

	var viewerData struct {
		Data struct {
			Viewer struct {
				ID     int    `json:"id"`
				Name   string `json:"name"`
				Avatar struct {
					Large string `json:"large"`
				} `json:"avatar"`
			} `json:"Viewer"`
		} `json:"data"`
	}
	json.NewDecoder(userResp.Body).Decode(&viewerData)
	v := viewerData.Data.Viewer

	var user models.User
	err = config.DB.QueryRow(context.Background(),
		`INSERT INTO users (anilist_id, username, avatar_url, role)
		 VALUES ($1, $2, $3, 'member')
		 ON CONFLICT (anilist_id) DO UPDATE SET username = EXCLUDED.username, avatar_url = EXCLUDED.avatar_url
		 RETURNING id, anilist_id, username, avatar_url, role`,
		v.ID, v.Name, v.Avatar.Large,
	).Scan(&user.ID, &user.AnilistID, &user.Username, &user.AvatarURL, &user.Role)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"status": "error", "message": "Database error"})
	}

	token, _ := generateToken(user)
	return c.JSON(fiber.Map{"status": "success", "token": token, "user": user})
}

// 5. Get Profile (/auth/me)
func GetMe(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int)
	var user models.User
	err := config.DB.QueryRow(context.Background(),
		`SELECT id, anilist_id, username, email, avatar_url, role, created_at FROM users WHERE id = $1`,
		userID,
	).Scan(&user.ID, &user.AnilistID, &user.Username, &user.Email, &user.AvatarURL, &user.Role, &user.CreatedAt)

	if err != nil {
		return c.Status(404).JSON(fiber.Map{"status": "error", "message": "User not found"})
	}
	return c.JSON(fiber.Map{"status": "success", "user": user})
}

// 6. Change Password (เปลี่ยนรหัสผ่านในหน้า Profile)
func ChangePassword(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int)
	var body struct {
		CurrentPassword string `json:"currentPassword"`
		NewPassword     string `json:"newPassword"`
	}
	if err := c.BodyParser(&body); err != nil || len(body.NewPassword) < 8 {
		return c.Status(400).JSON(fiber.Map{"status": "error", "message": "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร"})
	}

	var passHash *string
	config.DB.QueryRow(context.Background(), `SELECT password_hash FROM users WHERE id = $1`, userID).Scan(&passHash)
	if passHash != nil && bcrypt.CompareHashAndPassword([]byte(*passHash), []byte(body.CurrentPassword)) != nil {
		return c.Status(401).JSON(fiber.Map{"status": "error", "message": "รหัสผ่านปัจจุบันไม่ถูกต้อง"})
	}

	newHash, _ := bcrypt.GenerateFromPassword([]byte(body.NewPassword), 10)
	_, err := config.DB.Exec(context.Background(), `UPDATE users SET password_hash = $1 WHERE id = $2`, string(newHash), userID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"status": "error", "message": "เปลี่ยนรหัสผ่านไม่สำเร็จ"})
	}
	return c.JSON(fiber.Map{"status": "success", "message": "เปลี่ยนรหัสผ่านสำเร็จ"})
}