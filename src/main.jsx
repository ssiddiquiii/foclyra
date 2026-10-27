import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import BootstrapGate from './components/BootstrapGate.jsx'
import '@fontsource-variable/geist';
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BootstrapGate>
      <App />
    </BootstrapGate>
  </React.StrictMode>,
)
