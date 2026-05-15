import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Apply saved theme before first render to prevent flash
document.documentElement.setAttribute(
  'data-theme',
  localStorage.getItem('sl-theme') ?? 'dark',
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
