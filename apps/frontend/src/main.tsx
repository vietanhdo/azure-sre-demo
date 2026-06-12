import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { initializeTelemetry } from './telemetry'

// Fetch the connection string from Vite Env (injected at build time)
const connectionString = import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING || '';
initializeTelemetry(connectionString);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
