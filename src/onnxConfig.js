/**
 * ONNX Runtime 配置文件
 * 在任何导入 onnxruntime-web 之前加载此文件，确保使用CDN
 */

// 定义全局配置，这会在 onnxruntime-web 加载前设置环境变量
window.__ONNX_CONFIG__ = {
  wasmPaths: {
    'ort-wasm-simd-threaded.jsep.wasm': 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.21.0/dist/ort-wasm-simd-threaded.jsep.wasm',
    'ort-wasm-simd-threaded.wasm': 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.21.0/dist/ort-wasm-simd-threaded.wasm',
    'ort-wasm-simd.wasm': 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.21.0/dist/ort-wasm-simd.wasm',
    'ort-wasm-threaded.wasm': 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.21.0/dist/ort-wasm-threaded.wasm',
    'ort-wasm.wasm': 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.21.0/dist/ort-wasm.wasm'
  }
};

// 拦截和重写所有WASM请求
const originalFetch = window.fetch;
window.fetch = function(url, options) {
  if (typeof url === 'string' && url.includes('onnxruntime-web') && url.endsWith('.wasm')) {
    const fileName = url.split('/').pop();
    const cdnUrl = `https://cdn.jsdelivr.net/npm/onnxruntime-web@1.21.0/dist/${fileName}`;
    console.log(`全局拦截WASM请求: ${url} -> ${cdnUrl}`);
    return originalFetch(cdnUrl, options);
  }
  return originalFetch(url, options);
};

export default window.__ONNX_CONFIG__;
