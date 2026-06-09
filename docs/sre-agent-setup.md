# Azure SRE Agent - Portal Setup & Configuration Guide

In this demo, the **Azure SRE Agent** is implemented as an **Autonomous Runbook** using a combination of **Azure Logic Apps (Standard/Consumption)** and **Azure OpenAI**. This acts as the "brain" that receives alerts, gathers evidence, performs Root Cause Analysis (RCA), and executes auto-remediation.

This guide walks you through setting up the Agent directly on the Azure Portal.

---

## 🏗️ Prerequisites
Before starting, ensure you have the following ready:
1. **Azure OpenAI Resource:** Deployed with a `gpt-4o` or `gpt-4-turbo` model. Note the Endpoint and API Key.
2. **GitHub Personal Access Token (PAT):** Must have `repo` read access to scan source code and workflow runs.
3. **Telegram Bot Token & Chat ID:** Created via BotFather on Telegram.
4. **Log Analytics Workspace (LAW) & ACA Environment:** Deployed via our Terraform scripts.

---

## Step 1: Create the Logic App & System Identity
The Logic App serves as the orchestrator. It needs an Identity to securely access other Azure resources (Zero Trust approach).

1. Go to the Azure Portal -> **Logic Apps** -> **Add**.
2. Select your Resource Group (`rg-sre-demo`) and choose **Consumption** plan (cost-optimized for event-driven execution).
3. Once created, go to **Identity** (under Settings).
4. Turn on **System assigned managed identity** and save.

## Step 2: Grant Permissions (RBAC)
The SRE Agent needs to query logs and perform rollbacks. Assign the following roles to the Logic App's Managed Identity:
1. Go to your **Log Analytics Workspace** -> **Access control (IAM)** -> Add Role Assignment.
   - Role: **Log Analytics Reader**
   - Assign to: Managed Identity -> Your Logic App.
2. Go to your **Azure Container App** (`ca-sre-backend`) -> **Access control (IAM)**.
   - Role: **Contributor** (Needed to execute `az containerapp ingress traffic set` via REST API for rollback).

## Step 3: Build the Logic App Workflow
Open the **Logic App Designer** and build the following sequence:

### 1. Trigger: HTTP Request
- Use the **"When a HTTP request is received"** trigger.
- This provides a Webhook URL. Copy this URL (you will need it for the Azure Monitor Action Group).
- Define the JSON schema to match the Azure Monitor Alert payload (AlertContext).

### 2. Action: Query Log Analytics Workspace
- Add action: **Azure Monitor Logs -> Run query and list results**.
- **Query:** Connect it to the `cae-sre-demo` workspace.
- **KQL:** Inject the dynamic query to pull recent exceptions.
  ```kusto
  ContainerAppConsoleLogs_CL
  | where TimeGenerated > ago(10m)
  | where Log_Level_s == "ERROR" or Log_Message_s contains "OOMKilled"
  | project TimeGenerated, TraceId_s, Log_Message_s
  ```

### 3. Action: Query GitHub API (Evidence Gathering)
- Add action: **HTTP**.
- **Method:** GET
- **URI:** `https://api.github.com/repos/vietanhdo/azure-sre-demo/contents/apps/backend/handlers/fault.go` (or dynamically passed from logs).
- **Headers:** 
  - `Authorization`: `Bearer <YOUR_GITHUB_PAT>`
  - `Accept`: `application/vnd.github.v3+json`

### 4. Action: Azure OpenAI (The "Brain")
- Add action: **HTTP** (Calling Azure OpenAI REST API).
- **URI:** `<Your-OpenAI-Endpoint>/openai/deployments/gpt-4o/chat/completions?api-version=2024-02-15-preview`
- **Headers:** `api-key: <Your-OpenAI-Key>`
- **Body:** Pass a system prompt defining its Persona (SRE Expert), and the context: The errors from LAW + The Source Code from GitHub. Ask it to output a JSON object containing `incident_id`, `root_cause`, and `suggested_action`.

### 5. Action: Telegram Notification
- Add action: **HTTP**.
- **Method:** POST
- **URI:** `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/sendMessage`
- **Body:** Send the formatted RCA summary from OpenAI to your `<CHAT_ID>`.

### 6. Action: Auto-Remediation (ACA Rollback)
- Add a **Condition** check: If OpenAI's JSON response `auto_remediated` == `true`.
- Add action: **HTTP** (Calling Azure Resource Manager REST API).
- **Method:** PUT
- **URI:** `https://management.azure.com/subscriptions/{subId}/resourceGroups/rg-sre-demo/providers/Microsoft.App/containerApps/ca-sre-backend?api-version=2023-05-01`
- **Authentication:** Select **Managed Identity**.
- **Body:** Send the payload to set the ingress traffic weight back to `latestRevision: true` with 100% weight, effectively reverting the Canary.

## Step 4: Link to Azure Monitor Alert
Finally, connect the telemetry to the brain.
1. Go to **Azure Monitor** -> **Alerts** -> **Action Groups**.
2. Create an Action Group named `ag-sre-agent`.
3. In **Actions**, select **Webhook** and paste the URL from your Logic App Trigger.
4. Ensure your alert rule (e.g., HTTP 5xx Rate > 5%) is configured to trigger this Action Group.

---

## ⚠️ Gap Analysis: What are we missing for a 100% Demo?

Everything is fundamentally in place, but to make the demo flawlessly execute live, please verify the following:

1. **Azure OpenAI Provisioning:** 
   Have you created the Azure OpenAI instance and deployed the `gpt-4o` model? The Terraform scripts do not provision this due to quota complexities in subscriptions. **(Reminder: You need to do this manually or via a separate script).**
2. **Secrets Management:** 
   In a true production environment, the GitHub PAT and Telegram Bot Token should not be pasted directly into the Logic App HTTP Action. They should be stored in **Azure Key Vault**. You may want to add a Key Vault retrieval step in the Logic App for maximum "Platform Engineer" credibility.
3. **Pipeline Logs Context (Optional but powerful):**
   You mentioned reading pipeline logs. In Step 3 (GitHub Integration), you can add an extra HTTP action to query GitHub Actions API: `GET /repos/{owner}/{repo}/actions/runs/{run_id}/logs` to feed the LLM with the deployment logs if the failure happened immediately after a pipeline run.
4. **Logic App ARM Template (IaC):**
   Currently, the guide shows how to set it up manually via Portal for visual effect. For 100% IaC completeness, we could export the Logic App as an ARM/Bicep template and include it in our Terraform. Do you want me to write the Terraform module for the Logic App as well?
