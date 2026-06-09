package middleware

import (
	"log/slog"
	"net/http"
	"time"

	"go.opentelemetry.io/otel/trace"
)

type responseWriterObserver struct {
	http.ResponseWriter
	status      int
	written     int64
	wroteHeader bool
}

func (w *responseWriterObserver) WriteHeader(code int) {
	if w.wroteHeader {
		return
	}
	w.status = code
	w.ResponseWriter.WriteHeader(code)
	w.wroteHeader = true
}

func (w *responseWriterObserver) Write(p []byte) (n int, err error) {
	if !w.wroteHeader {
		w.WriteHeader(http.StatusOK)
	}
	n, err = w.ResponseWriter.Write(p)
	w.written += int64(n)
	return
}

func Logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		observer := &responseWriterObserver{
			ResponseWriter: w,
			status:         http.StatusOK, // default if WriteHeader is not called
		}

		next.ServeHTTP(observer, r)

		duration := time.Since(start)

		// Extract trace ID if available
		spanContext := trace.SpanContextFromContext(r.Context())
		traceID := ""
		if spanContext.HasTraceID() {
			traceID = spanContext.TraceID().String()
		}

		// Use structured logging
		slog.Info("HTTP Request",
			slog.String("method", r.Method),
			slog.String("path", r.URL.Path),
			slog.Int("status", observer.status),
			slog.Duration("duration", duration),
			slog.String("user_agent", r.UserAgent()),
			slog.String("trace_id", traceID),
		)
	})
}
