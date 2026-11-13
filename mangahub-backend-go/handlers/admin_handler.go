package handlers

import (
	"context"
	"strconv"

	"mangahub-backend-go/config"
	"mangahub-backend-go/models"

	"github.com/gofiber/fiber/v2"
)

// GET /api/admin/stats
func GetAdminStats(c *fiber.Ctx) error {
	var users, mangas, reviews int64
	err := config.DB.QueryRow(context.Background(), `
		SELECT
			(SELECT COUNT(*) FROM users),
			(SELECT COUNT(*) FROM mangas),
			(SELECT COUNT(*) FROM reviews)
	`).Scan(&users, &mangas, &reviews)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "ดึงข้อมูลสรุปไม่สำเร็จ"})
	}
	return c.JSON(fiber.Map{
		"users":   users,
		"mangas":  mangas,
		"reviews": reviews,
	})
}

// GET /api/admin/users?page=1&perPage=50&search=
func GetAdminUsers(c *fiber.Ctx) error {
	page := c.QueryInt("page", 1)
	perPage := c.QueryInt("perPage", 50)
	if page < 1 {
		page = 1
	}
	if perPage < 1 {
		perPage = 50
	}
	if perPage > 100 {
		perPage = 100
	}
	search := "%" + c.Query("search", "") + "%"

	var total int
	if err := config.DB.QueryRow(context.Background(), `
		SELECT COUNT(*) FROM users
		WHERE username ILIKE $1 OR COALESCE(email, '') ILIKE $1`, search).Scan(&total); err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "ดึงจำนวนสมาชิกไม่สำเร็จ"})
	}
	rows, err := config.DB.Query(context.Background(), `
		SELECT id, anilist_id, username, email, avatar_url, role, created_at
		FROM users
		WHERE username ILIKE $1 OR COALESCE(email, '') ILIKE $1
		ORDER BY created_at DESC, id DESC
		LIMIT $2 OFFSET $3`, search, perPage+1, (page-1)*perPage)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "ดึงรายชื่อสมาชิกไม่สำเร็จ"})
	}
	defer rows.Close()

	users := []models.User{}
	hasNext := false
	for rows.Next() {
		var user models.User
		if err := rows.Scan(&user.ID, &user.AnilistID, &user.Username, &user.Email, &user.AvatarURL, &user.Role, &user.CreatedAt); err != nil {
			return c.Status(500).JSON(fiber.Map{"message": "อ่านข้อมูลสมาชิกไม่สำเร็จ"})
		}
		if len(users) == perPage {
			hasNext = true
			break
		}
		users = append(users, user)
	}
	return c.JSON(fiber.Map{"users": users, "total": total, "has_next": hasNext})
}

// PATCH /api/admin/users/:id/role
func UpdateAdminUserRole(c *fiber.Ctx) error {
	targetID, err := strconv.Atoi(c.Params("id"))
	if err != nil || targetID < 1 {
		return c.Status(400).JSON(fiber.Map{"message": "รหัสสมาชิกไม่ถูกต้อง"})
	}
	if c.Locals("user_id").(int) == targetID {
		return c.Status(400).JSON(fiber.Map{"message": "ไม่สามารถเปลี่ยน role ของบัญชีตัวเองได้"})
	}
	var body struct {
		Role string `json:"role"`
	}
	if err := c.BodyParser(&body); err != nil || (body.Role != "admin" && body.Role != "member") {
		return c.Status(400).JSON(fiber.Map{"message": "role ต้องเป็น admin หรือ member"})
	}
	tag, err := config.DB.Exec(context.Background(), `UPDATE users SET role = $1 WHERE id = $2`, body.Role, targetID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "เปลี่ยน role ไม่สำเร็จ"})
	}
	if tag.RowsAffected() == 0 {
		return c.Status(404).JSON(fiber.Map{"message": "ไม่พบสมาชิก"})
	}
	return c.JSON(fiber.Map{"message": "เปลี่ยน role สมาชิกแล้ว", "role": body.Role})
}
