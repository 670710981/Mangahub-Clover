package middleware

import (
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

func AuthenticateToken(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return c.Status(401).JSON(fiber.Map{"status": "error", "message": "Access token required"})
	}

	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "supersecretkey123"
	}

	token, err := jwt.Parse(parts[1], func(token *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})

	if err != nil || !token.Valid {
		return c.Status(403).JSON(fiber.Map{"status": "error", "message": "Invalid or expired token"})
	}

	claims := token.Claims.(jwt.MapClaims)
	c.Locals("user_id", int(claims["id"].(float64)))
	c.Locals("username", claims["username"].(string))
	if role, ok := claims["role"].(string); ok {
		c.Locals("role", role)
	} else {
		c.Locals("role", "member")
	}

	return c.Next()
}

// เช็กสิทธิ์เฉพาะ Admin (เช่น ตอนเพิ่ม/ลบมังงะ)
func RequireAdmin(c *fiber.Ctx) error {
	role := c.Locals("role")
	if role != "admin" {
		return c.Status(403).JSON(fiber.Map{"status": "error", "message": "Admin access required"})
	}
	return c.Next()
}