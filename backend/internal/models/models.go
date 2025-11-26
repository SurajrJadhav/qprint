package models

import "time"

type User struct {
	ID           int     `json:"id"`
	Username     string  `json:"username"`
	PasswordHash string  `json:"-"`
	Role         string  `json:"role"` // 'customer' or 'shopkeeper'
	Lat          float64 `json:"lat,omitempty"`
	Long         float64 `json:"long,omitempty"`
}

type File struct {
	ID         int       `json:"id"`
	UserID     int       `json:"user_id"`
	FilePath   string    `json:"-"`
	UniqueCode string    `json:"unique_code"`
	Status     string    `json:"status"` // 'uploaded', 'downloaded'
	CreatedAt  time.Time `json:"created_at"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type RegisterRequest struct {
	Username string  `json:"username"`
	Password string  `json:"password"`
	Role     string  `json:"role"`
	Lat      float64 `json:"lat,omitempty"`
	Long     float64 `json:"long,omitempty"`
}

type LoginResponse struct {
	Token string `json:"token"`
	Role  string `json:"role"`
}
