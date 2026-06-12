#!/bin/bash
# Stop script for Azure SRE Demo to save costs.
# Azure Container Apps does not have a "Stop" button.
# By scaling min and max replicas to 0, no compute is billed.

echo "Scaling down Container App (backend) to 0 replicas..."
az containerapp update \
  --name ca-sre-backend \
  --resource-group rg-sre-demo-demo \
  --min-replicas 0 \
  --max-replicas 0 \
  --output none

echo "Demo resources have been 'paused' successfully to minimize costs."
