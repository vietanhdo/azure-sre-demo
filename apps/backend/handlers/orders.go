package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
)

type Order struct {
	ID     string  `json:"id"`
	Status string  `json:"status"`
	Total  float64 `json:"total"`
}

type Product struct {
	ID    string  `json:"id"`
	Name  string  `json:"name"`
	Price float64 `json:"price"`
}

func Orders(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tracer := otel.Tracer("handlers")
	
	ctx, span := tracer.Start(ctx, "GetOrders")
	defer span.End()

	span.SetAttributes(attribute.String("handler.type", "orders"))

	// Simulate some work
	time.Sleep(50 * time.Millisecond)

	orders := []Order{
		{ID: "ORD-001", Status: "Processing", Total: 125.50},
		{ID: "ORD-002", Status: "Shipped", Total: 89.99},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(orders)
}

func Products(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tracer := otel.Tracer("handlers")
	
	_, span := tracer.Start(ctx, "GetProducts")
	defer span.End()

	span.SetAttributes(attribute.String("handler.type", "products"))

	// Simulate fast query
	time.Sleep(10 * time.Millisecond)

	products := []Product{
		{ID: "PROD-001", Name: "Widget", Price: 19.99},
		{ID: "PROD-002", Name: "Gadget", Price: 29.99},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(products)
}
