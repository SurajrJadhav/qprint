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
		created_at TIMESTAMP DEFAULT NOW(),
		print_type TEXT DEFAULT 'private',
		copies INT DEFAULT 1,
		print_mode TEXT DEFAULT 'single',
		color_mode TEXT DEFAULT 'bw',
		paper_size TEXT DEFAULT 'A4',
		num_pages INT DEFAULT 0,
		total_cost DECIMAL(10,2) DEFAULT 0,
		shop_id INT REFERENCES users(id),
		queue_position INT
	);
	`

	_, err := DB.Exec(context.Background(), query)
	if err != nil {
		log.Fatalf("Failed to initialize database schema: %v", err)
	}
}
