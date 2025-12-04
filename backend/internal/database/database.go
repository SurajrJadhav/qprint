package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

var DB *pgxpool.Pool

func Connect() {
	dsn := os.Getenv("DATABASE_URL")
	// DEBUG: Print DATABASE_URL after loading .env
	log.Printf("DEBUG: DATABASE_URL from env = %s", os.Getenv("DATABASE_URL"))

	if dsn == "" {
		log.Fatal("DATABASE_URL environment variable is not set")
	}

	// DEBUG: Print the actual DATABASE_URL being used
	log.Printf("DEBUG: DATABASE_URL = %s", dsn)

	config, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		log.Fatalf("Unable to parse database config: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	DB, err = pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		log.Fatalf("Unable to create connection pool: %v", err)
	}

	if err := DB.Ping(ctx); err != nil {
		log.Fatalf("Unable to ping database: %v", err)
	}

	fmt.Println("Connected to PostgreSQL database")
}

func Close() {
	if DB != nil {
		DB.Close()
	}
}
