package handlers

import (
	"encoding/json"
	"net/http"
	"runtime"
)

// Healthz godoc
// @Summary System health check
// @Description get the health status of the application
// @Tags system
// @Produce  json
// @Success 200 {object} map[string]string
// @Router /healthz [get]
func Healthz(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// Ready godoc
// @Summary System readiness check
// @Description get the readiness status of the application
// @Tags system
// @Produce  json
// @Success 200 {object} map[string]bool
// @Router /ready [get]
func Ready(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]bool{"ready": true})
}

// VersionHandler godoc
// @Summary Get application version
// @Description get the version, commit sha, and build time
// @Tags system
// @Produce  json
// @Success 200 {object} map[string]string
// @Router /api/version [get]
func VersionHandler(version, commit, buildTime string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{
			"version":    version,
			"commit":     commit,
			"build_time": buildTime,
			"go_version": runtime.Version(),
		})
	}
}
