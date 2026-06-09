# 1. Build stage
FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Extract version from build args or set default
ARG VERSION=dev
ARG COMMIT=unknown
ARG BUILD_TIME=unknown

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-X main.Version=${VERSION} -X main.CommitSHA=${COMMIT} -X main.BuildTime=${BUILD_TIME} -s -w" \
    -o backend main.go

# 2. Production stage (distroless)
FROM gcr.io/distroless/static-debian12:nonroot

WORKDIR /
COPY --from=builder /app/backend /backend

# Use non-root user
USER 65532:65532

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s \
  CMD ["/backend", "-healthcheck"] || exit 1 
  # Note: Distroless doesn't have curl/wget, so a proper healthcheck might require a tiny binary or just rely on orchestrator checks

ENTRYPOINT ["/backend"]
