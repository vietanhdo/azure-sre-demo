package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/azure-sre-demo/backend/handlers"
	"github.com/azure-sre-demo/backend/middleware"
	"github.com/azure-sre-demo/backend/telemetry"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
)

var (
	Version   = "dev"
	CommitSHA = "unknown"
	BuildTime = "unknown"
)

func main() {
	// 1. Initialize structured logger
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	// 2. Initialize OpenTelemetry
	ctx := context.Background()
	shutdown, err := telemetry.InitTelemetry(ctx, "ca-sre-backend", Version)
	if err != nil {
		slog.Error("Failed to initialize OpenTelemetry", "error", err)
	} else {
		defer func() {
			if err := shutdown(ctx); err != nil {
				slog.Error("Failed to shutdown OpenTelemetry", "error", err)
			}
		}()
	}

	// 3. Setup Routes
	mux := http.NewServeMux()

	// System handlers
	mux.HandleFunc("/healthz", handlers.Healthz)
	mux.HandleFunc("/ready", handlers.Ready)
	mux.HandleFunc("/api/version", handlers.VersionHandler(Version, CommitSHA, BuildTime))

	// Application handlers
	mux.HandleFunc("/api/orders", handlers.Orders)
	mux.HandleFunc("/api/products", handlers.Products)

	// Fault injection handlers
	mux.HandleFunc("/fault/error/enable", handlers.EnableError)
	mux.HandleFunc("/fault/error/disable", handlers.DisableError)
	mux.HandleFunc("/fault/latency/enable", handlers.EnableLatency)
	mux.HandleFunc("/fault/latency/disable", handlers.DisableLatency)
	mux.HandleFunc("/fault/oom", handlers.TriggerOOM)
	mux.HandleFunc("/fault/status", handlers.FaultStatus)

	// 4. Wrap with middleware (Fault -> Logging -> OTel)
	var handler http.Handler = mux
	handler = middleware.FaultInjection(handler)
	handler = middleware.Logging(handler)
	handler = otelhttp.NewHandler(handler, "http-server")

	// 5. Start Server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: handler,
	}

	go func() {
		slog.Info("Server starting", "port", port, "version", Version)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("Server error", "error", err)
			os.Exit(1)
		}
	}()

	// 6. Graceful Shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	slog.Info("Shutting down server...")

	ctxShutdown, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctxShutdown); err != nil {
		slog.Error("Server forced to shutdown", "error", err)
	}

	slog.Info("Server exited")
}
