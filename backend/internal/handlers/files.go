package handlers

import (
	"backend/internal/auth"
	"backend/internal/database"
	"backend/internal/models"
	"backend/internal/utils"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
)

const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

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

	// Get user ID from context
	claims, ok := r.Context().Value(auth.UserKey).(*auth.Claims)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	userID := claims.UserID

	// Parse print settings from form data
	printType := r.FormValue("print_type")
	if printType == "" {
		printType = "private"
	}

	copies, _ := strconv.Atoi(r.FormValue("copies"))
	if copies < 1 {
		copies = 1
	}

	printMode := r.FormValue("print_mode")
	if printMode == "" {
		printMode = "single"
	}

	colorMode := r.FormValue("color_mode")
	if colorMode == "" {
		colorMode = "bw"
	}

	paperSize := r.FormValue("paper_size")
	if paperSize == "" {
		paperSize = "A4"
	}

	// Count PDF pages
	numPages, err := utils.CountPDFPages(filePath)
	if err != nil {
		// If page counting fails, default to 1
		numPages = 1
	}

	// Calculate cost
	totalCost := utils.CalculateCost(numPages, copies)

	// Generate unique code
	uniqueCode := generateUniqueCode(6)

	// Handle queue print
	var shopID *int
	var queuePosition *int

	if printType == "queue" {
		shopIDStr := r.FormValue("shop_id")
		if shopIDStr != "" {
			sid, err := strconv.Atoi(shopIDStr)
			if err == nil {
				shopID = &sid

				// Get current queue position for this shop
				var maxPos int
				err = database.DB.QueryRow(context.Background(),
					"SELECT COALESCE(MAX(queue_position), 0) FROM files WHERE shop_id = $1 AND status != 'downloaded'",
					sid).Scan(&maxPos)
				if err == nil {
					newPos := maxPos + 1
					queuePosition = &newPos
				}
			}
		}
	}

	// Insert into database
	var fileID int
	err = database.DB.QueryRow(context.Background(),
		`INSERT INTO files (user_id, file_path, unique_code, print_type, copies, print_mode, 
		 color_mode, paper_size, num_pages, total_cost, shop_id, queue_position) 
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
		userID, filePath, uniqueCode, printType, copies, printMode,
		colorMode, paperSize, numPages, totalCost, shopID, queuePosition).Scan(&fileID)

	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Prepare response
	response := models.UploadResponse{
		FileID:        fileID,
		NumPages:      numPages,
		TotalCost:     totalCost,
		QueuePosition: queuePosition,
	}

	if printType == "private" {
		response.Code = uniqueCode
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func DownloadFile(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")

	var filePath, status string
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

	// Serve the file
	http.ServeFile(w, r, filePath)

	// NOTE: File is no longer auto-deleted here.
	// Shopkeeper must confirm print completion via /file/:code/confirm endpoint
}

func CheckFileStatus(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")

	var status string
	var queuePosition *int
	err := database.DB.QueryRow(context.Background(),
		"SELECT status, queue_position FROM files WHERE unique_code = $1", code).Scan(&status, &queuePosition)

	if err != nil {
		http.Error(w, "File not found", http.StatusNotFound)
		return
	}

	response := map[string]interface{}{
		"status": status,
	}

	if queuePosition != nil {
		response["queue_position"] = *queuePosition
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func GetNearestShops(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(auth.UserKey).(*auth.Claims)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var userLat, userLong float64
	err := database.DB.QueryRow(context.Background(),
		"SELECT lat, long FROM users WHERE id = $1", claims.UserID).Scan(&userLat, &userLong)

	if err != nil {
		http.Error(w, "User location not found", http.StatusNotFound)
		return
	}

	rows, err := database.DB.Query(context.Background(),
		"SELECT id, username, lat, long, address FROM users WHERE role = 'shopkeeper'")
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type Shop struct {
		ID       int     `json:"id"`
		Username string  `json:"username"`
		Distance float64 `json:"distance"`
		Address  *string `json:"address,omitempty"`
		Lat      float64 `json:"lat"`
		Long     float64 `json:"long"`
	}

	var shops []Shop
	for rows.Next() {
		var id int
		var username string
		var lat, long float64
		var address *string
		if err := rows.Scan(&id, &username, &lat, &long, &address); err != nil {
			continue
		}

		distance := haversine(userLat, userLong, lat, long)
		shops = append(shops, Shop{
			ID:       id,
			Username: username,
			Distance: distance,
			Address:  address,
			Lat:      lat,
			Long:     long,
		})
	}

	// Sort shops by distance
	sort.Slice(shops, func(i, j int) bool {
		return shops[i].Distance < shops[j].Distance
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(shops)
}

func GetShopQueue(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(auth.UserKey).(*auth.Claims)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Verify user is a shopkeeper
	var role string
	err := database.DB.QueryRow(context.Background(),
		"SELECT role FROM users WHERE id = $1", claims.UserID).Scan(&role)
	if err != nil || role != "shopkeeper" {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	rows, err := database.DB.Query(context.Background(),
		`SELECT f.id, u.username, f.file_path, f.copies, f.print_mode, f.color_mode, 
		 f.paper_size, f.num_pages, f.total_cost, f.queue_position, f.created_at
		 FROM files f
		 JOIN users u ON f.user_id = u.id
		 WHERE f.shop_id = $1 AND f.status != 'downloaded' AND f.print_type = 'queue'
		 ORDER BY f.queue_position ASC`, claims.UserID)

	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var queue []models.QueueFile
	for rows.Next() {
		var qf models.QueueFile
		var filePath string
		if err := rows.Scan(&qf.ID, &qf.CustomerName, &filePath, &qf.Copies, &qf.PrintMode,
			&qf.ColorMode, &qf.PaperSize, &qf.NumPages, &qf.TotalCost, &qf.QueuePosition, &qf.CreatedAt); err != nil {
			continue
		}
		qf.Filename = filepath.Base(filePath)
		queue = append(queue, qf)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"queue": queue})
}

func DownloadQueueFile(w http.ResponseWriter, r *http.Request) {
	fileIDStr := chi.URLParam(r, "fileId")
	fileID, err := strconv.Atoi(fileIDStr)
	if err != nil {
		http.Error(w, "Invalid file ID", http.StatusBadRequest)
		return
	}

	claims, ok := r.Context().Value(auth.UserKey).(*auth.Claims)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Get file info and verify it belongs to this shop
	var filePath string
	var shopID int
	err = database.DB.QueryRow(context.Background(),
		"SELECT file_path, shop_id FROM files WHERE id = $1", fileID).Scan(&filePath, &shopID)

	if err != nil {
		http.Error(w, "File not found", http.StatusNotFound)
		return
	}

	if shopID != claims.UserID {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	// Serve the file
	http.ServeFile(w, r, filePath)

	// NOTE: File is no longer auto-deleted here.
	// Shopkeeper must confirm print completion via /queue/:fileId/confirm endpoint
}

func GetMyFiles(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(auth.UserKey).(*auth.Claims)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	rows, err := database.DB.Query(context.Background(),
		`SELECT f.id, f.unique_code, f.print_type, f.status, f.copies, f.print_mode, 
		 f.color_mode, f.paper_size, f.num_pages, f.total_cost, f.queue_position, 
		 f.created_at, u.username as shop_name, u.lat as shop_lat, u.long as shop_long
		 FROM files f
		 LEFT JOIN users u ON f.shop_id = u.id
		 WHERE f.user_id = $1
		 ORDER BY f.created_at DESC`, claims.UserID)

	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var files []map[string]interface{}
	for rows.Next() {
		var id int
		var uniqueCode, printType, status, printMode, colorMode, paperSize string
		var copies, numPages int
		var totalCost float64
		var queuePosition *int
		var createdAt time.Time
		var shopName *string
		var shopLat, shopLong *float64

		if err := rows.Scan(&id, &uniqueCode, &printType, &status, &copies, &printMode,
			&colorMode, &paperSize, &numPages, &totalCost, &queuePosition, &createdAt, &shopName, &shopLat, &shopLong); err != nil {
			continue
		}

		fileData := map[string]interface{}{
			"id":         id,
			"code":       uniqueCode,
			"print_type": printType,
			"status":     status,
			"copies":     copies,
			"print_mode": printMode,
			"color_mode": colorMode,
			"paper_size": paperSize,
			"num_pages":  numPages,
			"total_cost": totalCost,
			"created_at": createdAt,
		}

		if queuePosition != nil {
			fileData["queue_position"] = *queuePosition
		}
		if shopName != nil {
			fileData["shop_name"] = *shopName
		}
		if shopLat != nil {
			fileData["shop_lat"] = *shopLat
		}
		if shopLong != nil {
			fileData["shop_long"] = *shopLong
		}

		files = append(files, fileData)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"files": files})
}

// ConfirmPrivatePrint marks a private print file as downloaded and deletes it
func ConfirmPrivatePrint(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")

	claims, ok := r.Context().Value(auth.UserKey).(*auth.Claims)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var filePath string
	err := database.DB.QueryRow(context.Background(),
		"SELECT file_path FROM files WHERE unique_code = $1", code).Scan(&filePath)

	if err != nil {
		http.Error(w, "File not found", http.StatusNotFound)
		return
	}

	// Update status to downloaded and set shop_id to current user (shopkeeper)
	_, err = database.DB.Exec(context.Background(),
		"UPDATE files SET status = 'downloaded', shop_id = $1 WHERE unique_code = $2", claims.UserID, code)
	if err != nil {
		fmt.Printf("Error updating file status: %v\n", err)
	}

	// Delete the file from server
	os.Remove(filePath)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Print confirmed"})
}

// ConfirmQueuePrint marks a queue print file as downloaded and deletes it
func ConfirmQueuePrint(w http.ResponseWriter, r *http.Request) {
	fileIDStr := chi.URLParam(r, "fileId")
	fileID, err := strconv.Atoi(fileIDStr)
	if err != nil {
		http.Error(w, "Invalid file ID", http.StatusBadRequest)
		return
	}

	claims, ok := r.Context().Value(auth.UserKey).(*auth.Claims)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Get file info and verify it belongs to this shop
	var filePath string
	var shopID int
	err = database.DB.QueryRow(context.Background(),
		"SELECT file_path, shop_id FROM files WHERE id = $1", fileID).Scan(&filePath, &shopID)

	if err != nil {
		http.Error(w, "File not found", http.StatusNotFound)
		return
	}

	if shopID != claims.UserID {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	// Update status and delete file
	_, err = database.DB.Exec(context.Background(),
		"UPDATE files SET status = 'downloaded' WHERE id = $1", fileID)
	if err != nil {
		fmt.Printf("Error updating file status: %v\n", err)
	}

	// Reorder queue positions
	database.DB.Exec(context.Background(),
		`UPDATE files SET queue_position = queue_position - 1 
		 WHERE shop_id = $1 AND status != 'downloaded' AND queue_position > 
		 (SELECT queue_position FROM files WHERE id = $2)`, shopID, fileID)

	// Delete the file from server
	os.Remove(filePath)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Print confirmed"})
}

func haversine(lat1, lon1, lat2, lon2 float64) float64 {
	const R = 6371 // Earth radius in kilometers
	dLat := (lat2 - lat1) * math.Pi / 180
	dLon := (lon2 - lon1) * math.Pi / 180
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*math.Pi/180)*math.Cos(lat2*math.Pi/180)*
			math.Sin(dLon/2)*math.Sin(dLon/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return R * c
}

func GetShopHistory(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(auth.UserKey).(*auth.Claims)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Fetch all files printed by this shop (status='downloaded')
	rows, err := database.DB.Query(context.Background(),
		`SELECT id, unique_code, print_type, copies, num_pages, total_cost, created_at 
		 FROM files 
		 WHERE shop_id = $1 AND status = 'downloaded' 
		 ORDER BY created_at DESC`, claims.UserID)

	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var history []map[string]interface{}
	for rows.Next() {
		var id, copies, numPages int
		var uniqueCode, printType string
		var totalCost float64
		var createdAt time.Time

		if err := rows.Scan(&id, &uniqueCode, &printType, &copies, &numPages, &totalCost, &createdAt); err != nil {
			continue
		}

		history = append(history, map[string]interface{}{
			"id":     id,
			"code":   uniqueCode,
			"type":   printType,
			"copies": copies,
			"pages":  numPages,
			"cost":   totalCost,
			"date":   createdAt,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"history": history})
}
