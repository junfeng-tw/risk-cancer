import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import LiverCancerPredictor from './LiverCancerPredictor'
import { ModelLoadingProvider } from './contexts/ModelLoadingContext'
import ModelLoadingIndicator from './components/ModelLoadingIndicator'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ModelLoadingProvider>
      <LiverCancerPredictor />
      <ModelLoadingIndicator />
    </ModelLoadingProvider>
  </React.StrictMode>,
)
