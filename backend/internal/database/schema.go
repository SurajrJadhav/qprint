package database

import (
	"context"
	"log"
)

func InitSchema() {
	query := `
	CREATE TABLE IF NOT EXISTS users (
		id SERIAL PRIMARY KEY,
		username TEXT UNIQUE NOT NULL,
		password_hash TEXT NOT NULL,
		role TEXT NOT NULL,
		lat DOUBLE PRECISION,
		long DOUBLE PRECISION
	);

	CREATE TABLE IF NOT EXISTS files (
		id SERIAL PRIMARY KEY,
		user_id INT REFERENCES users(id),
		file_path TEXT NOT NULL,
		unique_code TEXT UNIQUE NOT NULL,
		status TEXT DEFAULT 'uploaded',
		created_at TIMESTAMP DEFAULT NOW()
	);
	`

	_, err := DB.Exec(context.Background(), query)
	if err != nil {
		log.Fatalf("Failed to initialize database schema: %v", err)
	}
}
