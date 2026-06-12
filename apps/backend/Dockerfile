# 1. Build stage
FROM golang:1.23-alpine AS builder

# Install CA certificates to copy into scratch image for outbound TLS
RUN apk add --no-cache ca-certificates

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .

ARG VERSION=dev
ARG COMMIT=unknown
ARG BUILD_TIME=unknown

# Static build
ENV CGO_ENABLED=0 GOOS=linux
RUN go build -trimpath -buildvcs=false \
    -ldflags="-s -w -X main.Version=${VERSION} -X main.CommitSHA=${COMMIT} -X main.BuildTime=${BUILD_TIME}" \
    -o /app/backend ./main.go

# 2. Production stage (scratch)
FROM scratch

# Copy CA bundle and timezone data if needed
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt

# App binary
COPY --from=builder /app/backend /backend

# Non-root
USER 65532:65532
EXPOSE 8080

HEALTHCHECK CMD ["/backend","-healthcheck"] || exit 1
ENTRYPOINT ["/backend"]
