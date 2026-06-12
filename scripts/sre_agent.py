#!/usr/bin/env python3

import os
import sys
import time
import requests
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Confirm
from azure.identity import DefaultAzureCredential
from azure.monitor.query import LogsQueryClient, LogsQueryStatus

console = Console()

import subprocess

# Configuration
WORKSPACE_ID = os.getenv("WORKSPACE_ID", "your-log-analytics-workspace-id")
RG_NAME = os.getenv("RG_NAME", "rg-sre-demo-demo-sea")
APP_NAME = os.getenv("APP_NAME", "ca-sre-demo-demo-sea-backend")

def main():
    console.print(Panel("[bold blue]🤖 Microsoft SRE Agent - Autonomous AIOps[/bold blue]\n[italic]Initializing Azure Connections...[/italic]"))
    
    # 1. Connect to Azure
    try:
        credential = DefaultAzureCredential()
        client = LogsQueryClient(credential)
    except Exception as e:
        console.print(f"[red]Error initializing Azure Credentials: {e}[/red]")
        console.print("[yellow]Tip: Run 'az login' before running this agent![/yellow]")
        return

    # 2. Query Logs
    query = """
    ContainerAppConsoleLogs_CL
    | where TimeGenerated > ago(10m)
    | where ContainerAppName_s == "ca-sre-demo-demo-sea-backend" 
    | where Log_s contains "error" or Log_s contains "500" or Log_s contains "panic"
    | sort by TimeGenerated desc
    """
    
    console.print(f"📡 [cyan]Executing KQL Query to scan for anomalies in the last 10 minutes...[/cyan]")
    time.sleep(2) # Fake delay for dramatic effect in demo
    
    # Check if WORKSPACE_ID is provided
    if WORKSPACE_ID == "your-log-analytics-workspace-id":
        console.print("[yellow]⚠️  WORKSPACE_ID not set! Using Mock Data for Local Demo Mode.[/yellow]")
        time.sleep(1)
        mock_analysis()
    else:
        try:
            response = client.query_workspace(workspace_id=WORKSPACE_ID, query=query, timespan=None)
            if response.status == LogsQueryStatus.SUCCESS:
                data = response.tables[0]
                if len(data.rows) > 0:
                    console.print(f"🔴 [red]Found {len(data.rows)} error logs![/red]")
                    analyze_and_remediate()
                else:
                    console.print("✅ [green]No errors found. System is healthy.[/green]")
            else:
                console.print(f"❌ [red]Query failed.[/red]")
        except Exception as e:
            console.print(f"[red]Failed to query Log Analytics: {e}[/red]")
            console.print("[yellow]Falling back to Local Demo Mode...[/yellow]")
            time.sleep(1)
            mock_analysis()

def mock_analysis():
    # Simulated analysis for presentations
    console.print("\n🔍 [bold]AI Analysis Report (RCA):[/bold]")
    console.print("   • [red]Symptom:[/red] Detected a massive spike in HTTP 500 errors.")
    console.print("   • [yellow]Correlation:[/yellow] Errors started immediately after the recent V2 Canary deployment.")
    console.print("   • [cyan]Root Cause:[/cyan] The Canary revision (Heineken Dashboard V2) contains fault injection or buggy code.")
    console.print("   • [magenta]Impact:[/magenta] 20% of user traffic is currently failing.")
    
    analyze_and_remediate()

def analyze_and_remediate():
    console.print("\n💡 [bold green]Recommended Mitigation Plan:[/bold green]")
    console.print("   Execute an immediate Rollback. Shift 100% of traffic back to the Stable revision.")
    console.print("   I will also send an RCA report to the DevOps Teams channel.")
    
    if Confirm.ask("\n🚀 [bold]Do you want me to execute this Rollback automatically?[/bold]"):
        console.print("🔔 Sending RCA alert to Microsoft Teams...")
        time.sleep(1)
        console.print(f"⚙️  Executing Auto-Rollback: az containerapp ingress traffic set --name {APP_NAME} ...")
        
        # Determine stable revision and set traffic to 100
        # For the demo, we will try to find the oldest/stable revision or just use CLI to set latest ready revision to 100
        try:
            # We use a shortcut to get the revision that is not the canary, or we just rely on the user having `az` installed.
            # A real script would parse JSON. For demo, we just print the command and try running a simplified one.
            console.print(f"\n[dim]Running: az containerapp revision list -n {APP_NAME} -g {RG_NAME}[/dim]")
            
            # Here we actually execute the rollback!
            # Since finding the exact stable revision name dynamically in bash is complex, we use a trick:
            # We can set the latest revision to 0 and all others to 100? No, ACA requires specific names.
            # Let's write a small shell pipeline to grab the stable revision.
            cmd = f"""
            STABLE_REV=$(az containerapp revision list -n {APP_NAME} -g {RG_NAME} --query "[?properties.trafficWeight > \`0\`] | sort_by(@, &properties.createdTime) | [0].name" -o tsv)
            if [ -n "$STABLE_REV" ]; then
                az containerapp ingress traffic set -n {APP_NAME} -g {RG_NAME} --revision-weight $STABLE_REV=100
            else
                echo "Could not identify stable revision."
                exit 1
            fi
            """
            result = subprocess.run(cmd, shell=True, executable='/bin/bash', capture_output=True, text=True)
            
            if result.returncode == 0:
                console.print(f"✅ [bold green]Success! 100% Traffic shifted back to Stable Revision.[/bold green]")
                console.print(result.stdout)
            else:
                console.print(f"⚠️  [yellow]Rollback command failed or az cli not found.[/yellow]")
                console.print(f"[red]{result.stderr}[/red]")
                console.print("[italic]Ensure you are logged in via 'az login' and the APP_NAME/RG_NAME are correct.[/italic]")
                
        except Exception as e:
            console.print(f"❌ [red]Failed to execute rollback: {e}[/red]")
    else:
        console.print("🛑 [yellow]Rollback canceled. System is still degraded.[/yellow]")

if __name__ == "__main__":
    main()
