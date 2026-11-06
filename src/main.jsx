import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import BootstrapGate from './components/BootstrapGate.jsx'
import ClerkSupabaseSync from './components/ClerkSupabaseSync.jsx'
import ThemedClerkProvider from './components/ThemedClerkProvider.jsx'
import MaintenanceScreen from './components/MaintenanceScreen.jsx'
import '@fontsource-variable/manrope';
import './index.css'
import { initAnalytics } from './services/analytics';

// Maintenance mode toggle (set to true if platform upgrades require pausing traffic)
const IS_MAINTENANCE_MODE = false;

const clerkPubKey =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  'pk_test_Zmx1ZW50LXBpcmFuaGEtNDE4NC5jbGVyay5hY2NvdW50cy5kZXYk';

// Initialize PostHog Web Analytics
initAnalytics();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {IS_MAINTENANCE_MODE ? (
      <MaintenanceScreen />
    ) : (
      <ThemedClerkProvider publishableKey={clerkPubKey}>
        <ClerkSupabaseSync />
        <BootstrapGate>
          <App />
        </BootstrapGate>
      </ThemedClerkProvider>
    )}
  </React.StrictMode>,
)
