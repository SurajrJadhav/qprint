package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"backend/internal/auth"
	"backend/internal/database"

	"github.com/go-chi/chi/v5"
)

const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

func generateUniqueCode(length int) string {
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return string(b)
}

func UploadFile(w http.ResponseWriter, r *http.Request) {
	// Limit file size to 10MB
	r.ParseMultipartForm(10 << 20)

	file, handler, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Error retrieving file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Create uploads directory if not exists
	if _, err := os.Stat("uploads"); os.IsNotExist(err) {
		os.Mkdir("uploads", 0755)
	}

	filename := fmt.Sprintf("%d-%s", time.Now().Unix(), handler.Filename)
	filePath := filepath.Join("uploads", filename)

	dst, err := os.Create(filePath)
	if err != nil {
		http.Error(w, "Error saving file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		http.Error(w, "Error saving file", http.StatusInternalServerError)
		return
	}

	uniqueCode := generateUniqueCode(6)

	claims, ok := r.Context().Value(auth.UserKey).(*auth.Claims)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	userID := claims.UserID

	_, err = database.DB.Exec(context.Background(),
		"INSERT INTO files (user_id, file_path, unique_code) VALUES ($1, $2, $3)",
		userID, filePath, uniqueCode)

	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"code": uniqueCode})
}

func DownloadFile(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")

	var filePath string
	var status string
	err := database.DB.QueryRow(context.Background(),
		"SELECT file_path, status FROM files WHERE unique_code = $1", code).Scan(&filePath, &status)

	if err != nil {
		http.Error(w, "File not found", http.StatusNotFound)
		return
	}

	// Check if file has already been downloaded
	if status == "downloaded" {
		http.Error(w, "File has already been downloaded and is no longer available", http.StatusGone)
		return
	}

	// Update status
	_, err = database.DB.Exec(context.Background(),
		"UPDATE files SET status = 'downloaded' WHERE unique_code = $1", code)
	if err != nil {
		// Log error but continue
		fmt.Println("Error updating status:", err)
	}

	// Serve the file
	http.ServeFile(w, r, filePath)

	// Delete the file after successful download to prevent re-downloading
	err = os.Remove(filePath)
	if err != nil {
		// Log error but don't fail the request since file was already served
		fmt.Printf("Warning: Failed to delete file %s: %v\n", filePath, err)
	} else {
		fmt.Printf("File deleted after download: %s\n", filePath)
	}
}

func GetFileStatus(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")

	var status string
	err := database.DB.QueryRow(context.Background(),
		"SELECT status FROM files WHERE unique_code = $1", code).Scan(&status)

	if err != nil {
		http.Error(w, "File not found", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"status": status})
}

func GetNearestShops(w http.ResponseWriter, r *http.Request) {
	// In a real app, we'd get lat/long from query params or user profile
	// Let's assume query params lat, long
	// For now, return all shopkeepers with distance

	rows, err := database.DB.Query(context.Background(), "SELECT id, username, lat, long FROM users WHERE role = 'shopkeeper'")
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var shops []map[string]interface{}
	// Mock user location (should be from request)
	userLat := 0.0
	userLong := 0.0

	for rows.Next() {
		var id int
		var username string
		var lat, long float64
		if err := rows.Scan(&id, &username, &lat, &long); err != nil {
			continue
		}

		// Simple distance calculation (Euclidean for simplicity, or Haversine)
		// Let's use simple Euclidean for now as lat/long are small differences locally
		// Or better, just return the raw data and let frontend calculate, or do it here.

		dist := math.Sqrt(math.Pow(lat-userLat, 2) + math.Pow(long-userLong, 2))

		shops = append(shops, map[string]interface{}{
			"id":       id,
			"username": username,
			"lat":      lat,
			"long":     long,
			"distance": dist, // This is raw degrees, not km/miles
		})
	}

	json.NewEncoder(w).Encode(shops)
}
