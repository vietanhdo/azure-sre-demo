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

**Context:** Our DevSecOps policy strictly prohibits deploying container images with `HIGH` or `CRITICAL` vulnerabilities. The pipeline uses `aquasecurity/trivy-action` with `exit-code: '1'`.

**Root Causes (common):**
- Base image contains OS-level vulnerabilities (e.g., distroless/debian, nginx-alpine).
- Outdated base image tags not pinned to patched digests.
- Trivy DB download failures (network/proxy/ratelimiting).

**Mitigation & Recovery Plan:**
1. Identify failing image (backend or frontend) and list CVEs from Trivy logs.
2. Apply image hygiene:
   - Pin and/or bump base image digests to latest patched versions.
   - Backend (Go): prefer `gcr.io/distroless/static-debian12:nonroot` (or pin digest). If fully static, `FROM scratch` is acceptable but verify CA certs if outbound TLS is needed.
   - Frontend: use `nginxinc/nginx-unprivileged:stable-alpine` (pin digest) to run as non-root.
3. Rebuild and rescan. If residual HIGH/CRITICAL persist:
   - Update OS packages in builder stages; ensure final image remains minimal.
   - Add a targeted `.trivyignore` with justification and expiry date (temporary only).
4. Trivy reliability:
   - Enable DB caching in CI before scan to avoid flakiness.
   - Consider `--ignore-unfixed` or limit severities only as a short-term unblocker.

**Verification:** CI completes with Trivy step `success`; no HIGH/CRITICAL reported.

---

## 1b. CI/CD Frontend Build Failures (npm run build)
**Symptom:** `Build Frontend Image` fails; logs show `npm run build`/`vite build`/`tsc` errors.

**Likely Root Causes:**
- `npm ci --omit=dev` used in the build stage removes devDependencies (e.g., `typescript`, `vite`).
- Missing/invalid `tsconfig.json` / `vite.config.ts`.
- Lockfile/package versions inconsistent.

**Mitigation & Recovery Plan:**
1. Ensure devDependencies are installed during build:
   ```Dockerfile
   # Build stage
   FROM node:20-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci            # do NOT use --omit=dev for build
   COPY . .
   RUN npm run build
   ```
2. Runtime image (non-root NGINX):
   ```Dockerfile
   FROM nginxinc/nginx-unprivileged:stable-alpine
   USER root
   COPY nginx.conf /etc/nginx/conf.d/default.conf
   COPY --from=builder /app/dist /usr/share/nginx/html
   RUN chown -R 101:101 /var/cache/nginx /var/run /var/log/nginx /etc/nginx /usr/share/nginx/html
   USER 101:101
   EXPOSE 8080
   CMD ["nginx", "-g", "daemon off;"]
   ```
3. Validate configs:
   - `package.json` has `build: "tsc -b && vite build"`.
   - `tsconfig.json`, `vite.config.ts` present and syntactically valid.
4. Re-run CI; confirm `Build Frontend Image` passes before Trivy.

**Verification:** Frontend image build succeeds; artifacts are placed under `/usr/share/nginx/html`; container listens on 8080.

---

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

---

## 3. High Resource Utilization & Performance Bottlenecks
**Symptom:** Azure Monitor fires an alert for CPU > 80% or Memory > 80%.

**Optimization Recommendations:**
1. Investigate application logs in Application Insights to identify any slow database queries or infinite loops.
2. Verify that KEDA HTTP autoscaling rules are scaling the replicas appropriately (up to max replicas).
3. If memory leaks are detected (e.g., OOMKilled exit code 137), recommend fixing the memory allocation in the Go code before arbitrarily increasing container resource limits.
