import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 自定义插件，用于拦截和重定向WASM请求
function redirectWasmRequests() {
  const CDN_BASE = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.21.0/dist/';

  return {
    name: 'redirect-wasm-requests',
    configureServer(server) {
      // 在开发服务器中拦截WASM请求
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.includes('onnxruntime-web') && req.url.endsWith('.wasm')) {
          const fileName = req.url.split('/').pop();
          const cdnUrl = `${CDN_BASE}${fileName}`;
          console.log(`拦截WASM请求: ${req.url} -> ${cdnUrl}`);
          res.writeHead(302, { 'Location': cdnUrl });
          res.end();
          return;
        }
        next();
      });
    },
    // 在构建时也处理WASM路径
    transform(code, id) {
      if (id.includes('onnxruntime-web') && code.includes('.wasm')) {
        // 替换代码中的WASM路径引用
        return code.replace(
          /['"]([^'"]*\.wasm)['"]|([^a-zA-Z0-9_])(https?:\/\/[^'"]*\.wasm)/g,
          (match, p1, p2, p3) => {
            if (p1) {
              const fileName = p1.split('/').pop();
              return `"${CDN_BASE}${fileName}"`;
            } else if (p3) {
              return `${p2}${CDN_BASE}${p3.split('/').pop()}`;
            }
            return match;
          }
        );
      }
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: '/risk-cancer/',
  plugins: [
    react(),
    redirectWasmRequests() // 添加自定义插件
  ],

  // ONNX配置：包含.onnx文件作为资源并排除onnxruntime-web依赖
  assetsInclude: ["**/*.onnx"],
  optimizeDeps: {
    exclude: ["onnxruntime-web"],
  },

  // 完全排除WASM文件处理
  build: {
    commonjsOptions: {
      exclude: [/onnxruntime-web[\/]dist[\/].*\.wasm/],
    },
    rollupOptions: {
      external: [/.*\.wasm/], // 将所有WASM文件标记为外部资源
    }
  },

  // 配置解析，确保不会尝试处理WASM文件
  resolve: {
    alias: {
      // 将所有WASM路径重定向到CDN
      'onnxruntime-web/dist': 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.21.0/dist',
    },
  },
})
