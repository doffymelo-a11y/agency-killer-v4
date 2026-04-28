import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { validateEnvironmentOrThrow } from './lib/env-validator'

// SECURITY: Validate environment variables before starting the app
validateEnvironmentOrThrow();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
