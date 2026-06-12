package telemetry

import (
	"os"
	"strings"

	"github.com/microsoft/ApplicationInsights-Go/appinsights"
)

var AppInsightsClient appinsights.TelemetryClient

func InitAppInsights() func() {
	connStr := os.Getenv("APPLICATIONINSIGHTS_CONNECTION_STRING")
	iKey := os.Getenv("APPINSIGHTS_INSTRUMENTATIONKEY")
	
	if iKey == "" && connStr != "" {
		// Parse Connection String to extract Instrumentation Key
		parts := strings.Split(connStr, ";")
		for _, part := range parts {
			if strings.HasPrefix(part, "InstrumentationKey=") {
				iKey = strings.TrimPrefix(part, "InstrumentationKey=")
				break
			}
		}
	}

	if iKey != "" {
		AppInsightsClient = appinsights.NewTelemetryClient(iKey)
		// Set Cloud Role Name for Application Map
		AppInsightsClient.Context().Tags.Cloud().SetRole("backend")
		
		// Return a func to flush on shutdown
		return func() {
			select {
			case <-AppInsightsClient.Channel().Close(10 * 1000 * 1000 * 1000): // 10 seconds
			}
		}
	}
	return func() {}
}
