package middleware

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/azure-sre-demo/backend/handlers"
)

func FaultInjection(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Do not inject faults into system or fault management endpoints
		if strings.HasPrefix(r.URL.Path, "/healthz") || 
		   strings.HasPrefix(r.URL.Path, "/ready") || 
		   strings.HasPrefix(r.URL.Path, "/fault") {
			next.ServeHTTP(w, r)
			return
		}

		// Inject Error
		if handlers.ErrorEnabled.Load() {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Internal Server Error",
				"code":  "SIMULATED_FAULT",
			})
			return
		}

		// Inject Latency
		if handlers.LatencyEnabled.Load() {
			time.Sleep(time.Duration(handlers.LatencyMs.Load()) * time.Millisecond)
		}

		next.ServeHTTP(w, r)
	})
}
