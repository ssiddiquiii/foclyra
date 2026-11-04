import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.jsx'
import BootstrapGate from './components/BootstrapGate.jsx'
import ClerkSupabaseSync from './components/ClerkSupabaseSync.jsx'
import MaintenanceScreen from './components/MaintenanceScreen.jsx'
import '@fontsource-variable/geist';
import './index.css'
import { initAnalytics } from './services/analytics';

// Set to true to temporarily take down site with a professional "Changes in Progress" screen
const IS_MAINTENANCE_MODE = true;

const clerkPubKey =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  'pk_test_ZGVzdGluZWQtcGFycm90LTc5Mi5jbGVyay5hY2NvdW50cy5kZXYk';

// Initialize PostHog Web Analytics
initAnalytics();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {IS_MAINTENANCE_MODE ? (
      <MaintenanceScreen />
    ) : (
      <ClerkProvider publishableKey={clerkPubKey}>
        <ClerkSupabaseSync />
        <BootstrapGate>
          <App />
        </BootstrapGate>
      </ClerkProvider>
    )}
  </React.StrictMode>,
)
