package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"runtime"
	"strconv"
	"sync/atomic"
)

var (
	// FaultState is global state for the fault injector
	ErrorEnabled   atomic.Bool
	LatencyEnabled atomic.Bool
	LatencyMs      atomic.Int64
)

func init() {
	LatencyMs.Store(2000) // Default 2s latency
}

// EnableError godoc
// @Summary Enable 500 errors
// @Description start injecting HTTP 500 errors into responses
// @Tags fault
// @Produce  plain
// @Success 200 {string} string "Errors enabled"
// @Router /fault/error/enable [post]
func EnableError(w http.ResponseWriter, r *http.Request) {
	ErrorEnabled.Store(true)
	slog.Warn("Fault Injection: HTTP 500 errors ENABLED")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Errors enabled\n"))
}

// DisableError godoc
// @Summary Disable 500 errors
// @Description stop injecting HTTP 500 errors
// @Tags fault
// @Produce  plain
// @Success 200 {string} string "Errors disabled"
// @Router /fault/error/disable [post]
func DisableError(w http.ResponseWriter, r *http.Request) {
	ErrorEnabled.Store(false)
	slog.Warn("Fault Injection: HTTP 500 errors DISABLED")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Errors disabled\n"))
}

// EnableLatency godoc
// @Summary Enable response latency
// @Description inject latency into responses
// @Tags fault
// @Param ms query int false "Milliseconds of latency" default(2000)
// @Produce  plain
// @Success 200 {string} string "Latency enabled"
// @Router /fault/latency/enable [post]
func EnableLatency(w http.ResponseWriter, r *http.Request) {
	if msStr := r.URL.Query().Get("ms"); msStr != "" {
		if ms, err := strconv.ParseInt(msStr, 10, 64); err == nil {
			LatencyMs.Store(ms)
		}
	}
	LatencyEnabled.Store(true)
	slog.Warn("Fault Injection: Latency ENABLED", "ms", LatencyMs.Load())
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Latency enabled\n"))
}

// DisableLatency godoc
// @Summary Disable response latency
// @Description stop injecting latency
// @Tags fault
// @Produce  plain
// @Success 200 {string} string "Latency disabled"
// @Router /fault/latency/disable [post]
func DisableLatency(w http.ResponseWriter, r *http.Request) {
	LatencyEnabled.Store(false)
	slog.Warn("Fault Injection: Latency DISABLED")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Latency disabled\n"))
}

// TriggerOOM godoc
// @Summary Trigger Out Of Memory
// @Description starts an infinite allocation loop to crash the app
// @Tags fault
// @Produce  plain
// @Success 202 {string} string "OOM simulation started"
// @Router /fault/oom [post]
func TriggerOOM(w http.ResponseWriter, r *http.Request) {
	slog.Warn("Fault Injection: Triggering OOM Simulation")
	
	// Respond immediately before we crash
	w.WriteHeader(http.StatusAccepted)
	w.Write([]byte("OOM simulation started in background\n"))

	// Allocate memory in background until killed
	go func() {
		var blocks [][]byte
		for {
			// Allocate 10MB at a time
			b := make([]byte, 10*1024*1024)
			// Touch it to ensure it's actually allocated
			for i := range b {
				b[i] = 1
			}
			blocks = append(blocks, b)
			
			var m runtime.MemStats
			runtime.ReadMemStats(&m)
			slog.Warn("OOM Simulation Allocating", "alloc_mb", m.Alloc/1024/1024, "sys_mb", m.Sys/1024/1024)
		}
	}()
}

// FaultStatus godoc
// @Summary Get fault injection status
// @Description returns current fault injection toggles and memory stats
// @Tags fault
// @Produce  json
// @Success 200 {object} map[string]interface{}
// @Router /fault/status [get]
func FaultStatus(w http.ResponseWriter, r *http.Request) {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	status := map[string]interface{}{
		"error_enabled":   ErrorEnabled.Load(),
		"latency_enabled": LatencyEnabled.Load(),
		"latency_ms":      LatencyMs.Load(),
		"mem_alloc_mb":    m.Alloc / 1024 / 1024,
		"mem_sys_mb":      m.Sys / 1024 / 1024,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(status)
}
