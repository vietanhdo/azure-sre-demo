package telemetry

import (
	"os"

	"github.com/microsoft/ApplicationInsights-Go/appinsights"
)

var AppInsightsClient appinsights.TelemetryClient

func InitAppInsights() func() {
	connStr := os.Getenv("APPLICATIONINSIGHTS_CONNECTION_STRING")
	if connStr != "" {
		AppInsightsClient = appinsights.NewTelemetryClient(connStr)
		// Return a func to flush on shutdown
		return func() {
			select {
			case <-AppInsightsClient.Channel().Close(10 * 1000 * 1000 * 1000): // 10 seconds
			}
		}
	}
	return func() {}
}
