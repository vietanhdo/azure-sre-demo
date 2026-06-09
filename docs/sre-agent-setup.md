# Azure SRE Agent: Official Portal Setup Guide

This guide walks you through setting up the **official Microsoft Azure SRE Agent** via the Azure Portal. This setup connects the SRE Agent to your Git repositories, enables pipeline log analysis, and integrates with Azure Container Apps (ACA) logs via Azure Monitor to achieve an autonomous, self-healing architecture.

## Prerequisites

1. **Azure Subscription** with permissions to create resources.
2. **Azure SRE Agent** enabled in your region/tenant.
3. **GitHub Repository** (or Azure DevOps) containing your source code and CI/CD pipelines.
4. **Log Analytics Workspace** connected to your Azure Container Apps.

---

## Phase 1: Provisioning the Azure SRE Agent

1. Log in to the **[Azure Portal](https://portal.azure.com)**.
2. In the global search bar, type **Azure SRE Agent** and select it from the services list.
3. Click **Create** or **Get Started**.
4. Fill in the basics:
   - **Subscription**: Select your target subscription.
   - **Resource Group**: Select `rg-sre-demo` (or create a new one).
   - **Name**: `sre-agent-demo` (or similar).
   - **Region**: Choose a supported region.
5. Click **Review + create** and then **Create**.
   > **Note**: When you create an agent, Azure automatically provisions an Application Insights instance, a Log Analytics workspace, and a Managed Identity for the agent.

---

## Phase 2: Connecting to Source Control & Pipelines (GitHub)

To allow the SRE Agent to perform root cause analysis (RCA) on bad deployments, it needs access to your source code and GitHub Actions pipeline logs.

1. Navigate to your newly created **Azure SRE Agent** resource in the Portal.
2. In the left navigation menu, go to **Integrations**.
3. Under the **Source control and CI/CD** section, select **GitHub**.
4. Click **Connect** or **Add Integration**.
5. Authenticate via OAuth or provide a **Personal Access Token (PAT)** with `repo` and `workflow` scopes.
6. Select your target repository (e.g., `vietanhdo/azure-sre-demo`).
7. **Pipeline Logs**: Ensure the integration settings check the box to allow the agent to read **Actions / Workflow Runs**. This grants the agent permission to read pipeline logs when an incident is triggered.

---

## Phase 3: Integrating Observability (ACA Logs)

The SRE Agent needs to read your Azure Container Apps logs to detect exceptions, OOMs, and high latency.

1. In the SRE Agent menu, go to **Integrations** > **Monitoring and observability**.
2. Select **Azure Monitor** (and/or Log Analytics).
3. The SRE Agent leverages its **Managed Identity** to query metrics and logs. Ensure the SRE Agent's managed identity has the **Monitoring Reader** and **Log Analytics Reader** roles on your ACA's Log Analytics Workspace.
4. **Test the Connection**: In the SRE Agent interface, you can try querying Kusto (KQL) directly. For example:
   ```kusto
   ContainerAppConsoleLogs_CL
   | where TimeGenerated > ago(1h)
   | where Log_s contains "Exception" or Log_s contains "Error"
   ```

---

## Phase 4: Building a Custom Subagent & Workflow

To perfectly fit the demo scenario (detecting an issue, analyzing logs, and rolling back), we will build a custom workflow using SRE Agent's subagents.

1. Go to the **Agent Builder** or **Subagents** tab in the SRE Agent portal.
2. Click **Create subagent**.
3. **Name**: `ACA-Incident-Responder`.
4. **Instructions**: Provide natural language instructions for the agent. Example:
   > "You are an SRE Subagent responsible for monitoring Azure Container Apps. When an Azure Monitor Alert fires for high error rates:
   > 1. Query the Log Analytics workspace for the exact application exceptions.
   > 2. Check the GitHub integration for the latest workflow run logs to see what was recently deployed.
   > 3. Analyze the source code changes from the latest commit.
   > 4. Summarize the Root Cause Analysis (RCA).
   > 5. Suggest or execute a rollback by updating the ACA traffic split back to the stable revision."
5. **Tools / Integrations**: Attach the **Azure Monitor**, **GitHub**, and **Azure CLI / ARM REST** tools to this subagent so it has the permissions to execute the plan.
6. Save the subagent.

---

## Phase 5: Handling an Incident (End-to-End Demo Flow)

1. **Trigger an Alert**: Go to your Azure Monitor Alerts and ensure an alert rule is set up to fire when the ACA HTTP 500 rate spikes.
2. **Route to SRE Agent**: Configure the Alert Processing Rule / Action Group to route the incident to the Azure SRE Agent.
3. **Execution**:
   - The alert triggers the SRE Agent.
   - SRE Agent uses the `ACA-Incident-Responder` subagent.
   - It fetches the ACA logs via Log Analytics.
   - It fetches the GitHub Action pipeline logs via the GitHub integration.
   - It correlates the bad commit with the error logs.
   - *Optional*: It posts the RCA to an Incident Management tool (like ServiceNow/PagerDuty) or triggers a webhook to your Telegram.
4. **Review / Auto-Heal**: Depending on your configuration, the agent will either ask for human approval ("Human-in-the-loop") or automatically execute the Azure CLI command to roll back the ACA revision.

---

### ⚠️ Gap Analysis for the Demo

If you are transitioning your demo from a custom Logic App to the official Azure SRE Agent, keep these points in mind:

1. **Product Availability**: Ensure Azure SRE Agent is available in your subscription/tenant. It may still be in preview depending on your region.
2. **Telegram Integration**: The official Azure SRE Agent has native integrations for ServiceNow, PagerDuty, and Azure Monitor Alerts. To send a message to Telegram, you might need to use a custom **Model Context Protocol (MCP)** server or an Azure Function webhook triggered by the agent.
3. **Human-in-the-loop vs Autonomous**: SRE Agent strongly supports human oversight. For the demo, you can show the SRE Agent's UI where it explains the RCA timeline and proposes the mitigation, and you simply click "Approve" to let it roll back ACA.
