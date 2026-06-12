# Azure SRE Autonomous Operations Demo

![Azure SRE Demo](https://img.shields.io/badge/Status-Complete-success.svg)
![Architecture](https://img.shields.io/badge/Architecture-Azure%20Container%20Apps-blue.svg)
![Language](https://img.shields.io/badge/Backend-Go%201.22-00ADD8.svg)

Welcome to the **Azure SRE Autonomous Operations Demo**. This repository contains a fully functional, production-grade mono-repo designed for a 120-minute live demonstration on modern Site Reliability Engineering, Evidence-Based Deployments, Chaos Engineering, and AI-driven Root Cause Analysis.

## What is this?

This project demonstrates the transition from reactive operations to autonomous operations. 

**Key Scenarios Covered:**
1. **The Context (Telemetry):** Instrumenting a Go backend using OpenTelemetry and pushing structured JSON logs to Azure Log Analytics Workspace.
2. **Evidence-Based Canary Deployments:** Splitting traffic (e.g., 80/20) across Azure Container Apps revisions and observing impact.
3. **Chaos Engineering:** Injecting HTTP 500 errors, latency spikes, and OOM (Out Of Memory) conditions on demand using a dedicated fault injection API.
4. **Autonomous RCA (Real AI):** Leveraging the official **Azure SRE Agent** (via MCP) connected directly to GitHub and Azure Monitor to analyze CI/CD pipeline failures (e.g., Trivy security blocks) and runtime logs, pushing actionable root cause analysis directly to a **Telegram Bot**.

## Repository Structure

```text
azure-sre-demo/
├── apps/
│   ├── backend/         # Go 1.22 backend service (OpenTelemetry, Fault Injector)
│   └── frontend/        # React + Vite Dashboard (Tailwind CSS, Glassmorphism UI)
├── docs/                # Comprehensive documentation
│   ├── architecture.md  # Architecture deep-dive
│   └── demo-guide.md    # Step-by-step guide to run the 120-minute demo
├── environments/        # Terraform variables per environment
├── infra/               # Infrastructure as Code (Terraform)
│   └── terraform/       # ACA, ACR, VNet, Log Analytics, Grafana modules
├── kql/                 # Kusto Query Language files for Log Analytics
├── loadtest/            # k6 scripts for baseline and fault scenarios
├── scripts/             # Automation scripts for CI/CD and Demo Orchestration
└── presentation.html    # 120-minute scripted HTML slide deck (Reveal.js)
```

## Quick Start

1. **Check Prerequisites:**
   ```bash
   cd scripts/
   ./00-prerequisites.sh
   ```
   *Required: `az`, `terraform`, `docker`, `k6`, `jq`, `curl`.*

2. **Run the Full Demo Flow:**
   The `demo-full-flow.sh` script provides an interactive step-by-step orchestrator that pauses and prompts you before executing the next phase of the demo.
   ```bash
   ./demo-full-flow.sh
   ```

3. **View the Presentation:**
   Open `presentation.html` in your web browser. Press the `s` key on your keyboard to open the **Speaker Notes view**, which includes the full English script and timing.

## Documentation

For deep-dives into the setup, architecture, and exact step-by-step manual execution, please refer to the `docs/` folder:

* [Architecture Overview](docs/architecture.md)
* [Demo Execution Guide](docs/demo-guide.md)
