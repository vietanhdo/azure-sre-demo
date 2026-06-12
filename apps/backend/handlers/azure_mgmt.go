package handlers

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"time"

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

type RevisionInfo struct {
	Name        string   `json:"name"`
	Active      bool     `json:"active"`
	Replicas    int32    `json:"replicas"`
	Traffic     int32    `json:"trafficWeight"`
	ReplicaList []string `json:"replicaList"`
}

// GetRevisions returns a list of active revisions and their replicas
func GetRevisions(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	cred, err := azidentity.NewDefaultAzureCredential(nil)
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

	pager := revisionsClient.NewListRevisionsPager(resourceGroup, appName, nil)

	var results []RevisionInfo

	for pager.More() {
		page, err := pager.NextPage(ctx)
		if err != nil {
			http.Error(w, "Failed to list revisions: "+err.Error(), http.StatusInternalServerError)
			return
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
			repResp, err := replicasClient.ListReplicas(ctx, resourceGroup, appName, *rev.Name, nil)
			if err == nil {
				for _, replica := range repResp.Value {
					info.ReplicaList = append(info.ReplicaList, *replica.Name)
				}
			}

			results = append(results, info)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(results)
}

// StreamLogs streams logs from Log Analytics Workspace using Server-Sent Events (SSE)
func StreamLogs(w http.ResponseWriter, r *http.Request) {
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
	cred, err := azidentity.NewDefaultAzureCredential(nil)
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
				| where ContainerAppName_s == '%s'
				| where TimeGenerated > datetime('%s')
				| project TimeGenerated, RevisionName_s, ContainerName_s, Log_s
				| order by TimeGenerated asc
				| limit 100
			`, appName, timeStr)

			resp, err := client.QueryWorkspace(ctx, workspaceID, azquery.Body{
				Query: to.Ptr(query),
			}, nil)

			if err != nil {
				slog.Error("Log query failed", "error", err)
				continue
			}

			if len(resp.Tables) > 0 && len(resp.Tables[0].Rows) > 0 {
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
