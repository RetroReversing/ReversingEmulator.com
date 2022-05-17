package main

import (
	"log"
	"net/http"
	"os"

	"junie/endpoints"
	"junie/helpers"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func main() {
	settings := helpers.GetSettings()

	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.NoCache)

	helpers.UseStaticFiles(r, "", settings.Binaries)

	r.Get("/api/library", endpoints.SendLibrary)
	r.Get("/api/library/{system}/{filename}", endpoints.SendGame)
	r.Get("/covers/{system}/{filename}", endpoints.SendCover)

	port, found := os.LookupEnv("PORT")
	if !found {
		port = "3000"
	}

	log.Printf("Listening on :%s...\n", port)
	err := http.ListenAndServe(":"+port, r)

	if err != nil {
		log.Fatal(err)
	}
}
