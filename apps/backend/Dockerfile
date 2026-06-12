# 1. Build stage
FROM golang:1.25-alpine AS builder

RUN apk add --no-cache ca-certificates

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .

ARG VERSION=dev
ARG COMMIT=unknown
ARG BUILD_TIME=unknown

# Static build + size/cve-friendly flags
ENV CGO_ENABLED=0 GOOS=linux
RUN go env -w GOMODCACHE=/go/pkg/mod \
 && go env -w GOPATH=/go \
 && go version \
 && go build -trimpath -buildvcs=false \
    -ldflags="-s -w -X main.Version=${VERSION} -X main.CommitSHA=${COMMIT} -X main.BuildTime=${BUILD_TIME}" \
    -o /app/backend ./main.go

# 2. Production stage (scratch for zero OS CVEs)
FROM scratch

WORKDIR /
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /app/backend /backend

USER 65532:65532
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s CMD ["/backend","-healthcheck"] || exit 1
ENTRYPOINT ["/backend"]
