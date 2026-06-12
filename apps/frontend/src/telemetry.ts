import { ApplicationInsights } from '@microsoft/applicationinsights-web';

let appInsights: ApplicationInsights | null = null;

export function initializeTelemetry(connectionString: string) {
  if (!connectionString) {
    console.warn('AppInsights connection string is empty, telemetry disabled.');
    return;
  }

  appInsights = new ApplicationInsights({
    config: {
      connectionString: connectionString,
      enableAutoRouteTracking: true,
      enableAjaxPerfTracking: true,
      disableFetchTracking: false,
      maxBatchSizeInBytes: 10000,
      maxBatchInterval: 5000, // Send data every 5 seconds
      correlationHeaderExcludedDomains: ['*'], // Necessary for localhost
    }
  });

  appInsights.loadAppInsights();
  appInsights.addTelemetryInitializer((envelope) => {
    envelope.tags = envelope.tags || [];
    envelope.tags['ai.cloud.role'] = 'frontend'; // Set cloud role name for app map
  });

  appInsights.trackPageView(); // Initial page view
}

export function getAppInsights() {
  return appInsights;
}
