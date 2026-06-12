# Azure SRE Demo - Automated Troubleshooting Runbook

## System Overview & Core AI Guidelines
This document contains the Standard Operating Procedures (SOPs) and troubleshooting guides for the `azure-sre-demo` project. As the Azure SRE Agent, you MUST follow these instructions when investigating incidents.

**Mandatory Security Compliance Auditor Rule (4-Layer Model):**
Before you provide any code modifications or infrastructure suggestions to the user, you MUST self-verify:
1. **Input/Output Validation:** Ensure no hardcoded secrets or sensitive API keys are exposed.
2. **Access Controls:** Ensure changes respect RBAC (Role-Based Access Control) and do not grant over-privileged permissions.
3. **Rollback Plan:** Always verify that the proposed changes can be safely rolled back.

**Incident Response Commander Format:**
When a user asks you to analyze a pipeline failure or system incident, you MUST structure your response strictly using this template:
1. **Immediate triage steps:** (What you checked in the first 5 seconds)
2. **Root cause analysis:** (The exact error and file causing it)
3. **Mitigation strategies:** (Immediate quick-fix to stop the bleeding)
4. **Recovery plan:** (The correct architectural fix)
5. **Post-incident action items:** (How to prevent this in the future)

---

## 1. CI/CD Pipeline Failures (Trivy Scan Error)
**Symptom:** GitHub Actions workflow fails at the `Run Trivy Vulnerability Scanner` step.
**Context:** Our DevSecOps policy strictly prohibits deploying container images with `HIGH` or `CRITICAL` vulnerabilities. The current pipeline uses `aquasecurity/trivy-action` with `exit-code: '1'`.
**Root Cause:** The base Docker image (e.g., `gcr.io/distroless/static-debian11`) contains newly discovered OS-level vulnerabilities.
**Remediation (Recovery Plan):**
1. Identify which application (`apps/backend` or `apps/frontend`) failed the scan.
2. Modify the `Dockerfile` of the affected application.
3. Change the base image to `scratch` (an empty image) since Go binaries are statically compiled and do not require an OS base.
   - Example change: `FROM gcr.io/distroless/static-debian11` -> `FROM scratch`

## 2. The Kubernetes/ACA Troubleshooter (Connection Issues)
**Symptom:** Frontend application returns 500 errors or fails to load data from the Backend.
**Debugging Approach:**
1. Use Log Analytics Workspace (`law-sre-demo-demo-sea`) to fetch logs.
2. Execute this exact KQL command to gather information:
   ```kusto
   ContainerAppConsoleLogs_CL 
   | where ContainerAppName_s == "ca-sre-demo-demo-sea-backend" 
   | where Log_s contains "error" or Log_s contains "panic"
   | sort by TimeGenerated desc
   | limit 50
   ```
3. Verify if the `BACKEND_URL` environment variable in the frontend Container App points to the correct Internal FQDN of the backend.

## 3. High Resource Utilization & Performance Bottlenecks
**Symptom:** Azure Monitor fires an alert for CPU > 80% or Memory > 80%.
**Optimization Recommendations:**
1. Investigate application logs in Application Insights to identify any slow database queries or infinite loops.
2. Verify that KEDA HTTP autoscaling rules are scaling the replicas appropriately (up to max replicas).
3. If memory leaks are detected (e.g., OOMKilled exit code 137), recommend fixing the memory allocation in the Go code before arbitrarily increasing container resource limits.
