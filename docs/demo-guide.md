# Demo Execution Guide

This guide breaks down how to run the 120-minute presentation and execute the practical demos flawlessly.

## Prerequisites Check
Before presenting, ensure your local environment is ready:
1. Open a terminal.
2. Navigate to `scripts/`.
3. Run `./00-prerequisites.sh`. Make sure all dependencies (Azure CLI, Terraform, Docker, k6) are marked green.
4. Authenticate your Azure CLI: `az login`.

## The Presentation Flow

### Phase 1: Slides & Context (0-30 mins)
- Open `presentation.html` in a web browser.
- Press `s` to open the Speaker View and place it on your secondary monitor.
- Discuss "Garbage In, Garbage Out". Explain why structured JSON logging and OpenTelemetry are non-negotiable for AI agents.

### Phase 2: Deploying Infrastructure & The App (30-45 mins)
Instead of waiting 10 minutes for Terraform to deploy live, it is highly recommended to pre-deploy Phase 2 before the seminar:
1. Run `./01-infra-deploy.sh`.
2. Run `./02-app-build-push.sh` to build the Go and React images.
3. Run `./03-deploy-stable.sh` to start the application with 100% traffic on the "stable" revision.

*During the presentation:* You can open the Azure Portal to show the Container App Revisions panel with 100% traffic on `stable`.

### Phase 3: Evidence-Based Canary Deployment (45-70 mins)
1. In the background, start the normal load test so Grafana has data:
   ```bash
   k6 run ../loadtest/k6/normal-load.js
   ```
2. Explain that we have a new feature to release. Run the canary script:
   ```bash
   ./04-deploy-canary.sh --weight 20
   ```
3. Show the **React Dashboard**. The traffic split will visually update to 80% Stable / 20% Canary.
4. Open the Azure Portal Log Analytics Workspace. Run the query `kql/error-rate-by-revision.kql` to prove that the canary is healthy and error rates are negligible.

### Phase 4: Injecting Chaos & SLO Breach (70-95 mins)
1. It is time to break the application.
2. Stop the `normal-load.js` script (Ctrl+C).
3. Start the fault load scenario:
   ```bash
   k6 run ../loadtest/k6/fault-scenario.js
   ```
4. Immediately inject the fault:
   ```bash
   ./05-fault-inject.sh enable
   ```
5. **Observe:** Open the React Dashboard and Grafana. The Canary revision's error rate will spike. The SLO gauge will turn RED and display "BREACHED".

### Phase 5: Autonomous RCA & Auto-Remediation (95-110 mins)
1. Wait ~3-5 minutes. The Azure Monitor Alert will fire.
2. *Simulation Note:* Show a screenshot or a live Telegram channel where the "Azure SRE Agent" bot posts its findings.
   - The bot message should clearly state: "Memory leak/Error injected in `handlers/fault.go:42`".
3. The bot automatically executes a rollback.
4. Run the rollback script locally to mirror the bot's action:
   ```bash
   ./06-rollback.sh
   ```
5. **Observe Recovery:** Disable the fault (`./05-fault-inject.sh disable`). Watch the dashboard return to a healthy green state.

### Phase 6: Q&A and Teardown (110-120 mins)
1. Conclude the presentation.
2. After the session, clean up resources to avoid Azure charges:
   ```bash
   ./07-teardown.sh
   ```
