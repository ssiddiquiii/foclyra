import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.jsx'
import BootstrapGate from './components/BootstrapGate.jsx'
import ClerkSupabaseSync from './components/ClerkSupabaseSync.jsx'
import '@fontsource-variable/geist';
import './index.css'
import { initAnalytics } from './services/analytics';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

// Initialize PostHog Web Analytics
initAnalytics();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkPubKey}>
      <ClerkSupabaseSync />
      <BootstrapGate>
        <App />
      </BootstrapGate>
    </ClerkProvider>
  </React.StrictMode>,
)
