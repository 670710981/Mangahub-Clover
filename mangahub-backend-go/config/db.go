package config

import (
	"context"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

var DB *pgxpool.Pool

func ConnectDB() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("ไม่พบค่า DATABASE_URL ในไฟล์ .env")
	}

	pool, err := pgxpool.New(context.Background(), dsn)
	if err != nil {
		log.Fatalf("เชื่อมต่อ Supabase ไม่สำเร็จ: %v\n", err)
	}

	// ทดสอบ Ping ฐานข้อมูลจริง
	if err := pool.Ping(context.Background()); err != nil {
		log.Fatalf("Ping ฐานข้อมูลไม่ผ่าน: %v\n", err)
	}

	DB = pool
	log.Println("เชื่อมต่อ Supabase (PostgreSQL) สำเร็จ!")
}