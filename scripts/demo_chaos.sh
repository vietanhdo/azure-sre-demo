#!/bin/bash

# Configuration
if [ -z "$ACA_APP_URL" ]; then
    echo "Please provide the ACA_APP_URL (e.g., https://ca-sre-demo-demo-sea-frontend.xxxxxx.azurecontainerapps.io)"
    read -p "URL: " ACA_APP_URL
fi

# Ensure URL does not end with a slash
ACA_APP_URL=${ACA_APP_URL%/}

# For ACA traffic splitting, the frontend handles both root (serving UI) and proxies /api to backend
# Wait, does the frontend ACA proxy to backend ACA? We need to hit the backend directly, or proxy through frontend?
# Usually, in the previous ACA setup, frontend ACA calls backend ACA, but for the script, it's easier to hit the backend directly if it's public.
# Let's ask for the BACKEND URL
if [ -z "$ACA_BACKEND_URL" ]; then
    echo "Please provide the ACA_BACKEND_URL (e.g., https://ca-sre-demo-demo-sea-backend.xxxxxx.azurecontainerapps.io)"
    read -p "Backend URL: " ACA_BACKEND_URL
fi
ACA_BACKEND_URL=${ACA_BACKEND_URL%/}

API_ENDPOINT="${ACA_BACKEND_URL}/api/v2/heineken/metrics"
FAULT_ENDPOINT="${ACA_BACKEND_URL}/fault/error/enable"

echo "🍺 Starting Heineken Operations Load Simulator 🍺"
echo "Targeting: $API_ENDPOINT"
echo "------------------------------------------------"
echo "Press [ENTER] at any time to inject Chaos (500 Error)..."
echo "Press [CTRL+C] to exit."
echo "------------------------------------------------"

# Function to read user input asynchronously
chaos_triggered=0
read_input() {
    read -r
    chaos_triggered=1
}

# Start background input reader
read_input &

while true; do
    if [ $chaos_triggered -eq 1 ]; then
        echo -e "\n🔥 [CHAOS INJECTED] Calling fault endpoint: $FAULT_ENDPOINT"
        curl -s -X POST $FAULT_ENDPOINT > /dev/null
        echo "💥 500 Internal Server Errors are now enabled!"
        chaos_triggered=2 # Prevent re-triggering
    fi

    # Ping the API
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_ENDPOINT)
    
    if [ "$STATUS" = "200" ]; then
        echo -e "✅ [\033[32m200 OK\033[0m] Fetched Brewery Metrics successfully."
    elif [ "$STATUS" = "500" ]; then
        echo -e "❌ [\033[31m500 ERROR\033[0m] CRITICAL FAILURE: System Offline!"
    else
        echo -e "⚠️  [$STATUS] Unexpected response."
    fi

    sleep 1
done
