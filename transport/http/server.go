package http

import (
	"compress/gzip"
	"encoding/json"
	"fmt"
	"net/http"
	"oma/contract"
	"oma/ui"

	"github.com/go-chi/chi"
	"github.com/go-chi/chi/middleware"
	"github.com/go-chi/cors"
	"github.com/rs/zerolog/log"
)

type Server struct {
	conf *Config
	app  contract.App
}

func New(conf *Config, app contract.App) *Server {
	return &Server{
		conf: conf,
		app:  app,
	}
}

func (s *Server) Run() error {
	router := chi.NewRouter()
	router.Use(middleware.Logger)
	router.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedHeaders:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowCredentials: true,
	}))

	router.Route("/api", func(r chi.Router) {
		r.Post("/eval", s.eval)
		r.Post("/format", s.format)
		r.Post("/lint", s.lint)
		r.Get("/test-all", s.testAll)
	})

	router.Route("/api/revisions", func(r chi.Router) {
		r.Get("/", s.listRevisions)
		r.Get("/{revision_id}", s.downloadRevisionById)
		r.Get("/package/{package_id}", s.revisionFiles)
		r.Get("/package/{package_id}/{file_name}", s.downloadPackage)
		r.Get("/{package_type}/{name}/{version}/{file_name}", s.download)
	})

	router.Route("/api/decision-log", func(r chi.Router) {
		r.Post("/logs", s.pushDecisionLog)
		r.Get("/list", s.listDecisionLogs)
	})

	router.Route("/api/playground-log", func(r chi.Router) {
		r.Get("/logs", s.playgroundLogs)
	})

	assets, err := ui.Assets()
	if err != nil {
		log.Error().Err(err).Msg("failed to embed UI assets")
		return err
	}

	fs := http.FileServer(http.FS(assets))
	router.Handle("/assets/*", fs)
	router.HandleFunc("/*", func(w http.ResponseWriter, r *http.Request) {
		r.URL.Path = ""
		fs.ServeHTTP(w, r)
	})

	if err := http.ListenAndServe(fmt.Sprintf(":%d", s.conf.Port), router); err != nil {
		return err
	}

	return nil
}

func (s *Server) playgroundLogs(w http.ResponseWriter, r *http.Request) {
	logs, err := s.app.PlaygroundLogs(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(logs)
}

func jsonReqBody[T any](w http.ResponseWriter, r *http.Request) (*T, error) {
	t := new(T)

	if r.Header.Get("Content-Encoding") == "gzip" {
		gr, err := gzip.NewReader(r.Body)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return nil, err
		}
		defer gr.Close()

		// Decode the JSON from the decompressed body
		if err := json.NewDecoder(gr).Decode(t); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return nil, err
		}

	} else {
		if err := json.NewDecoder(r.Body).Decode(t); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return nil, err
		}

	}

	return t, nil
}
