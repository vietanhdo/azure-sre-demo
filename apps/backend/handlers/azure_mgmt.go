package handlers

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/Azure/azure-sdk-for-go/sdk/azcore"
	"github.com/Azure/azure-sdk-for-go/sdk/azcore/to"
	"github.com/Azure/azure-sdk-for-go/sdk/azidentity"
	"github.com/Azure/azure-sdk-for-go/sdk/monitor/azquery"
	"github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/appcontainers/armappcontainers"
)

const (
	subscriptionID = "19b55097-e862-4ac6-8a99-475e404f86bc"
	resourceGroup  = "rg-sre-demo-demo-sea"
	appName        = "ca-sre-demo-demo-sea-backend"
	workspaceID    = "fc401faa-1b12-4a51-ad8c-acccc7afd609"
)

// getAzureCredential creates the right credential based on environment.
// Uses User-Assigned Managed Identity when AZURE_CLIENT_ID is set (production),
// falls back to DefaultAzureCredential for local development.
func getAzureCredential() (azcore.TokenCredential, error) {
	clientID := os.Getenv("AZURE_CLIENT_ID")
	if clientID == "" {
		// Try the known User-Assigned MI client ID
		clientID = "e262dadd-5966-4406-8e9b-2888f0a84efa"
	}
	cred, err := azidentity.NewManagedIdentityCredential(&azidentity.ManagedIdentityCredentialOptions{
		ID: azidentity.ClientID(clientID),
	})
	if err != nil {
		// Fallback: local dev with az login
		slog.Warn("ManagedIdentityCredential failed, falling back to DefaultAzureCredential", "error", err)
		return azidentity.NewDefaultAzureCredential(nil)
	}
	return cred, nil
}

type RevisionInfo struct {
	Name        string   `json:"name"`
	Active      bool     `json:"active"`
	Replicas    int32    `json:"replicas"`
	Traffic     int32    `json:"trafficWeight"`
	ReplicaList []string `json:"replicaList"`
}

// @Summary Get Azure Container Apps Revisions
// @Description Fetches the active revisions and their replicas for the SRE backend container app
// @Tags Azure Management
// @Produce json
// @Success 200 {array} RevisionInfo
// @Failure 500 {string} string "Internal Server Error"
// @Router /api/azure/revisions [get]
// GetRevisions returns a list of active revisions and their replicas
func GetRevisions(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	slog.Info("Handling /api/azure/revisions request")

	cred, err := getAzureCredential()
	if err != nil {
		http.Error(w, "Failed to get Azure credential: "+err.Error(), http.StatusInternalServerError)
		return
	}

	clientFactory, err := armappcontainers.NewClientFactory(subscriptionID, cred, nil)
	if err != nil {
		http.Error(w, "Failed to create client factory: "+err.Error(), http.StatusInternalServerError)
		return
	}

	revisionsClient := clientFactory.NewContainerAppsRevisionsClient()
	replicasClient, err := armappcontainers.NewContainerAppsRevisionReplicasClient(subscriptionID, cred, nil)
	if err != nil {
		http.Error(w, "Failed to create replicas client: "+err.Error(), http.StatusInternalServerError)
		return
	}

	var results []RevisionInfo
	apps := []string{"ca-sre-demo-demo-sea-backend", "ca-sre-demo-demo-sea-frontend"}

	for _, currentApp := range apps {
		pager := revisionsClient.NewListRevisionsPager(resourceGroup, currentApp, nil)

		for pager.More() {
			page, err := pager.NextPage(ctx)
			if err != nil {
				slog.Error("Failed to list revisions for app", "app", currentApp, "error", err)
				continue
			}

			for _, rev := range page.Value {
				if rev.Properties == nil || rev.Properties.Active == nil || !*rev.Properties.Active {
					continue // Only care about active revisions
				}

				info := RevisionInfo{
					Name:     *rev.Name,
					Active:   *rev.Properties.Active,
					Replicas: *rev.Properties.Replicas,
				}
				if rev.Properties.TrafficWeight != nil {
					info.Traffic = *rev.Properties.TrafficWeight
				}

				// Get replicas for this revision
				repResp, err := replicasClient.ListReplicas(ctx, resourceGroup, currentApp, *rev.Name, nil)
				if err == nil {
					for _, replica := range repResp.Value {
						info.ReplicaList = append(info.ReplicaList, *replica.Name)
					}
				}

				results = append(results, info)
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(results)
}

// @Summary Stream Log Analytics Logs
// @Description Opens a Server-Sent Events (SSE) stream to push live console logs from Azure Log Analytics
// @Tags Azure Management
// @Produce text/event-stream
// @Success 200 {string} string "Event stream connected"
// @Failure 500 {string} string "Internal Server Error"
// @Router /api/azure/logs/stream [get]
// StreamLogs streams logs from Log Analytics Workspace using Server-Sent Events (SSE)
func StreamLogs(w http.ResponseWriter, r *http.Request) {
	slog.Info("Client connected to /api/azure/logs/stream")

	// Set headers for Server-Sent Events
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	ctx := r.Context()
	cred, err := getAzureCredential()
	if err != nil {
		fmt.Fprintf(w, "data: {\"error\": \"%s\"}\n\n", err.Error())
		flusher.Flush()
		return
	}

	client, err := azquery.NewLogsClient(cred, nil)
	if err != nil {
		fmt.Fprintf(w, "data: {\"error\": \"%s\"}\n\n", err.Error())
		flusher.Flush()
		return
	}

	// Keep track of the last time we queried logs to only get new ones
	lastTime := time.Now().Add(-5 * time.Minute) // Initial load: last 5 mins

	ticker := time.NewTicker(3 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			// Query logs since lastTime
			timeStr := lastTime.UTC().Format(time.RFC3339Nano)
			query := fmt.Sprintf(`
				ContainerAppConsoleLogs_CL
				| where ContainerAppName_s in ('ca-sre-demo-demo-sea-backend', 'ca-sre-demo-demo-sea-frontend')
				| where TimeGenerated > datetime('%s')
				| project TimeGenerated, RevisionName_s, ContainerName_s, Log_s
				| order by TimeGenerated asc
				| limit 100
			`, timeStr)

			resp, err := client.QueryWorkspace(ctx, workspaceID, azquery.Body{
				Query: to.Ptr(query),
			}, nil)

			if err != nil {
				slog.Error("Log query failed", "error", err)
				continue
			}

			if len(resp.Tables) > 0 && len(resp.Tables[0].Rows) > 0 {
				slog.Info("Fetched new logs from Log Analytics", "count", len(resp.Tables[0].Rows))
				for _, row := range resp.Tables[0].Rows {
					timeGeneratedStr := row[0].(string)
					parsedTime, _ := time.Parse(time.RFC3339Nano, timeGeneratedStr)
					if parsedTime.After(lastTime) {
						lastTime = parsedTime
					}

					logEntry := map[string]interface{}{
						"TimeGenerated": timeGeneratedStr,
						"RevisionName":  row[1],
						"ContainerName": row[2],
						"Log":           row[3],
					}

					dataBytes, _ := json.Marshal(logEntry)
					fmt.Fprintf(w, "data: %s\n\n", string(dataBytes))
				}
				flusher.Flush()
			}
		}
	}
}
