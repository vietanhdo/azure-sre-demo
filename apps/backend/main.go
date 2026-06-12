// @title Azure SRE Demo API
// @version 1.0
// @description This is a sample API for the Azure SRE Demo project.
// @BasePath /
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
	v2 "github.com/azure-sre-demo/backend/handlers/v2"
	"github.com/azure-sre-demo/backend/middleware"
	"github.com/azure-sre-demo/backend/telemetry"
	_ "github.com/azure-sre-demo/backend/docs"
	httpSwagger "github.com/swaggo/http-swagger/v2"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"github.com/rs/cors"
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

	// 2. Initialize OpenTelemetry & Application Insights
	ctx := context.Background()
	shutdownOTel, err := telemetry.InitTelemetry(ctx, "ca-sre-backend", Version)
	if err != nil {
		slog.Error("Failed to initialize OpenTelemetry", "error", err)
	}
	
	shutdownAppInsights := telemetry.InitAppInsights()

	defer func() {
		if shutdownOTel != nil {
			if err := shutdownOTel(ctx); err != nil {
				slog.Error("Failed to shutdown OpenTelemetry", "error", err)
			}
		}
		shutdownAppInsights()
	}()

	// 3. Setup Routes
	mux := http.NewServeMux()

	// System handlers
	mux.HandleFunc("/healthz", handlers.Healthz)
	mux.HandleFunc("/ready", handlers.Ready)
	mux.HandleFunc("/api/version", handlers.VersionHandler(Version, CommitSHA, BuildTime))

	// Application handlers
	mux.HandleFunc("/api/orders", handlers.Orders)
	mux.HandleFunc("/api/products", handlers.Products)
	
	// V2 Application handlers
	mux.HandleFunc("/api/v2/heineken/metrics", v2.HeinekenMetricsHandler)

	// Fault injection handlers
	mux.HandleFunc("/fault/error/enable", handlers.EnableError)
	mux.HandleFunc("/fault/error/disable", handlers.DisableError)
	mux.HandleFunc("/fault/latency/enable", handlers.EnableLatency)
	mux.HandleFunc("/fault/latency/disable", handlers.DisableLatency)
	mux.HandleFunc("/fault/oom", handlers.TriggerOOM)
	mux.HandleFunc("/fault/cpu", handlers.CPUStress)
	mux.HandleFunc("/fault/status", handlers.FaultStatus)

	// Swagger handler
	mux.HandleFunc("/swagger/", httpSwagger.Handler(
		httpSwagger.URL("/swagger/doc.json"), // The url pointing to API definition
	))

	// 4. Wrap with middleware (Fault -> Logging -> OTel -> CORS)
	var handler http.Handler = mux
	handler = middleware.FaultInjection(handler)
	handler = middleware.Logging(handler)
	handler = otelhttp.NewHandler(handler, "http-server")

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300, 
	})
	handler = c.Handler(handler)

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
