// 首先导入ONNX配置，确保在任何其他导入之前配置WASM路径
import './onnxConfig.js'

import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import LiverCancerPredictor from './LiverCancerPredictor'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LiverCancerPredictor />
  </React.StrictMode>,
)
