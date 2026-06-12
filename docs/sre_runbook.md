# Azure SRE Demo - Automated Troubleshooting Runbook

## System Overview
This document contains the Standard Operating Procedures (SOPs) and troubleshooting guides for the `azure-sre-demo` project. The SRE Agent MUST follow these instructions when investigating incidents.

## 1. CI/CD Pipeline Failures (Trivy Scan Error)
**Symptom:** GitHub Actions workflow fails at the `Run Trivy Vulnerability Scanner` step.
**Context:** Our DevSecOps policy strictly prohibits deploying container images with `HIGH` or `CRITICAL` vulnerabilities. The current pipeline uses `aquasecurity/trivy-action` with `exit-code: '1'`.
**Root Cause:** The base Docker image (e.g., `gcr.io/distroless/static-debian11`) contains newly discovered OS-level vulnerabilities.
**Remediation Steps:**
1. Identify which application (`apps/backend` or `apps/frontend`) failed the scan.
2. Modify the `Dockerfile` of the affected application.
3. Change the base image to `scratch` (an empty image) since Go binaries are statically compiled and do not require an OS base.
   - Example change: `FROM gcr.io/distroless/static-debian11` -> `FROM scratch`
4. Commit and push the changes to trigger a new build.

## 2. Backend API Connection Issues (Frontend cannot reach Backend)
**Symptom:** Frontend application returns 500 errors or fails to load data from the Backend.
**Investigation:** 
1. Query the Log Analytics workspace `law-sre-demo-demo-sea`.
2. Use the following KQL query to find backend errors:
   ```kusto
   ContainerAppConsoleLogs_CL 
   | where ContainerAppName_s == "ca-sre-demo-demo-sea-backend" 
   | where Log_s contains "error" or Log_s contains "panic"
   | sort by TimeGenerated desc
   | limit 50
   ```
**Remediation:**
1. Verify if the `BACKEND_URL` environment variable in the frontend Container App is pointing to the correct Internal FQDN of the backend.
2. Check if the Backend Container App is running out of memory (OOMKilled). If so, scale the container resources.

## 3. High Resource Utilization
**Symptom:** Azure Monitor fires an alert for CPU > 80% or Memory > 80%.
**Remediation:**
1. Investigate application logs in Application Insights to identify any slow database queries or infinite loops.
2. If it's a legitimate traffic spike, verify that KEDA HTTP autoscaling rules are scaling the replicas appropriately (up to max replicas).
