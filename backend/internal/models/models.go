package models

import "time"

type User struct {
	ID           int     `json:"id"`
	Username     string  `json:"username"`
	PasswordHash string  `json:"-"`
	Role         string  `json:"role"` // 'customer' or 'shopkeeper'
	Lat          float64 `json:"lat,omitempty"`
	Long         float64 `json:"long,omitempty"`
	Address      string  `json:"address,omitempty"`
}

type File struct {
	ID            int       `json:"id"`
	UserID        int       `json:"user_id"`
	FilePath      string    `json:"file_path"`
	UniqueCode    string    `json:"unique_code"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"created_at"`
	PrintType     string    `json:"print_type"`
	Copies        int       `json:"copies"`
	PrintMode     string    `json:"print_mode"`
	ColorMode     string    `json:"color_mode"`
	PaperSize     string    `json:"paper_size"`
	NumPages      int       `json:"num_pages"`
	TotalCost     float64   `json:"total_cost"`
	ShopID        *int      `json:"shop_id,omitempty"`
	QueuePosition *int      `json:"queue_position,omitempty"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type RegisterRequest struct {
	Username string   `json:"username"`
	Password string   `json:"password"`
	Role     string   `json:"role"`
	Lat      *float64 `json:"lat"`
	Long     *float64 `json:"long"`
	Address  string   `json:"address,omitempty"`
}

type LoginResponse struct {
	Token    string `json:"token"`
	Role     string `json:"role"`
	Username string `json:"username"`
}

type UploadRequest struct {
	PrintType string `json:"print_type"` // "private" or "queue"
	Copies    int    `json:"copies"`
	PrintMode string `json:"print_mode"` // "single" or "double"
	ColorMode string `json:"color_mode"` // "bw" or "color"
	PaperSize string `json:"paper_size"` // "A4", "Letter", etc.
	ShopID    *int   `json:"shop_id,omitempty"`
}

type UploadResponse struct {
	Code          string  `json:"code,omitempty"`
	FileID        int     `json:"file_id"`
	NumPages      int     `json:"num_pages"`
	TotalCost     float64 `json:"total_cost"`
	QueuePosition *int    `json:"queue_position,omitempty"`
}

type QueueFile struct {
	ID            int       `json:"id"`
	CustomerName  string    `json:"customer_name"`
	Filename      string    `json:"filename"`
	Copies        int       `json:"copies"`
	PrintMode     string    `json:"print_mode"`
	ColorMode     string    `json:"color_mode"`
	PaperSize     string    `json:"paper_size"`
	NumPages      int       `json:"num_pages"`
	TotalCost     float64   `json:"total_cost"`
	QueuePosition int       `json:"queue_position"`
	CreatedAt     time.Time `json:"created_at"`
}
