package v2

import (
	"encoding/json"
	"net/http"
	"time"
)

type Metric struct {
	Label  string `json:"label"`
	Value  string `json:"value"`
	Unit   string `json:"unit"`
	Status string `json:"status"` // "good", "warning", "critical"
	Trend  string `json:"trend"`  // "up", "down", "stable"
}

type HeinekenDashboardResponse struct {
	Status        string    `json:"status"`
	Location      string    `json:"location"`
	Timestamp     time.Time `json:"timestamp"`
	BreweryDORA   []Metric  `json:"breweryDora"`
	SystemMetrics []Metric  `json:"systemMetrics"`
}

// HeinekenMetricsHandler godoc
// @Summary Get Heineken metrics
// @Description get the regional metrics for Heineken SRE dashboard
// @Tags heineken
// @Produce  json
// @Success 200 {object} HeinekenDashboardResponse
// @Router /api/v2/heineken/metrics [get]
func HeinekenMetricsHandler(w http.ResponseWriter, r *http.Request) {
	// Simulate reasonable "Brewery SRE" metrics for Heineken
	response := HeinekenDashboardResponse{
		Status:    "healthy",
		Location:  "Global Brewery Operations (SEA Region)",
		Timestamp: time.Now(),
		BreweryDORA: []Metric{
			{
				Label:  "Brew Batch Frequency",
				Value:  "24",
				Unit:   "batches/day",
				Status: "good",
				Trend:  "stable",
			},
			{
				Label:  "Fermentation Lead Time",
				Value:  "21",
				Unit:   "days",
				Status: "good",
				Trend:  "down", // Faster is better
			},
			{
				Label:  "Batch Spoilage Rate",
				Value:  "0.05",
				Unit:   "%",
				Status: "good",
				Trend:  "stable",
			},
			{
				Label:  "Line Recovery Time",
				Value:  "12",
				Unit:   "mins",
				Status: "good",
				Trend:  "down",
			},
		},
		SystemMetrics: []Metric{
			{
				Label:  "Fermentation Temp",
				Value:  "11.5",
				Unit:   "°C",
				Status: "good",
				Trend:  "stable",
			},
			{
				Label:  "Bottling Line Uptime",
				Value:  "99.98",
				Unit:   "%",
				Status: "good",
				Trend:  "up",
			},
		},
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}
