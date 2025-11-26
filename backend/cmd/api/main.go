package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"backend/internal/auth"
	"backend/internal/database"
	"backend/internal/handlers"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
)

func main() {
	// Force load .env file and OVERRIDE any existing environment variables
	// This ensures .env file takes precedence over OS environment variables
	if err := godotenv.Overload(".env"); err != nil {
		// Try loading from backend directory if running from project root
		if err := godotenv.Overload("backend/.env"); err != nil {
			log.Println("No .env file found, using environment variables")
		} else {
			log.Println("Loaded and OVERRODE env vars from backend/.env")
		}
	} else {
		log.Println("Loaded and OVERRODE env vars from current directory")
	}

	// DEBUG: Print DATABASE_URL after loading .env
	log.Printf("DEBUG: DATABASE_URL from env = %s", os.Getenv("DATABASE_URL"))

	database.Connect()
	database.InitSchema()
	defer database.Close()

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"https://*", "http://*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Welcome to Qprint API - Print Without Standing in Queue"))
	})

	r.Post("/register", handlers.Register)
	r.Post("/login", handlers.Login)

	// Protected routes
	r.Group(func(r chi.Router) {
		r.Use(auth.AuthMiddleware)
		r.Post("/upload", handlers.UploadFile)
		r.Get("/shops", handlers.GetNearestShops)
	})

	// Public or Shopkeeper routes (maybe protect with shopkeeper role later)
	r.Get("/file/{code}", handlers.DownloadFile)
	r.Get("/file/{code}/status", handlers.GetFileStatus)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("Server running on port %s\n", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
