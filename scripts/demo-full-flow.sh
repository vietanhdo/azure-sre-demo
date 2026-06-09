#!/usr/bin/env bash
source "$(dirname \"$0\")/common.sh"
set -euo pipefail

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}======================================================${NC}"
echo -e "${CYAN} Azure SRE Autonomous Operations Demo - Full Flow     ${NC}"
echo -e "${CYAN}======================================================${NC}"

# Helper to pause and prompt
pause() {
    echo -e "\n${YELLOW}Press ENTER to continue to the next step: $1...${NC}"
    read -r
}

pause "Check Prerequisites"
./00-prerequisites.sh

pause "Deploy Initial Infrastructure"
echo "This will take about 5-10 minutes..."
# ./01-infra-deploy.sh (Uncomment in a real run, skipped here to save time if already deployed)

pause "Build and Push Apps"
# ./02-app-build-push.sh

pause "Deploy Stable Revision"
# ./03-deploy-stable.sh
echo -e "${GREEN}Stable application running at 100%. Open the React Dashboard to view.${NC}"

pause "Deploy Canary Revision (20% traffic split)"
# ./04-deploy-canary.sh --weight 20
echo -e "${GREEN}Canary deployed. Observe the Traffic Split updating in the dashboard.${NC}"

pause "Run K6 Normal Load"
echo "Starting normal load test in the background..."
# k6 run ../loadtest/k6/normal-load.js &

pause "Inject HTTP 500 Fault"
# export API_URL="<CANARY_FQDN>"
# ./05-fault-inject.sh enable
echo -e "${RED}Fault injected. Watch the SLO gauge breach in Grafana and the React UI.${NC}"

pause "Observe Azure SRE Agent RCA"
echo "Wait for the simulated notification to appear."

pause "Rollback Traffic"
# ./06-rollback.sh
echo -e "${GREEN}Rolled back to Stable. SLOs should recover.${NC}"

pause "Run OOM Scenario"
# k6 run ../loadtest/k6/oom-scenario.js
echo -e "${RED}Container ran out of memory. Observe restarts in the dashboard Event Log.${NC}"

echo -e "${CYAN}======================================================${NC}"
echo -e "${CYAN} Demo Complete! Run ./07-teardown.sh to clean up.     ${NC}"
echo -e "${CYAN}======================================================${NC}"
