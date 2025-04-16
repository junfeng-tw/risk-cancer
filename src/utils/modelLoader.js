/**
 * Utility functions for loading ONNX models with progress tracking
 */

/**
 * Fetch a file and track download progress
 * @param {string} url - URL of the file to fetch
 * @param {function} onProgress - Progress callback (receives percentage 0-100)
 * @returns {Promise<ArrayBuffer>} - The file data as ArrayBuffer
 */
export async function fetchWithProgress(url, onProgress) {
  try {
    // First, make a HEAD request to get the content length
    const headResponse = await fetch(url, { method: 'HEAD' });
    const contentLength = parseInt(headResponse.headers.get('content-length') || '0', 10);
    
    if (!contentLength) {
      console.warn('Could not determine content length for', url);
      // Fall back to regular fetch if we can't get the content length
      const response = await fetch(url);
      return await response.arrayBuffer();
    }
    
    // Now make the actual request
    const response = await fetch(url);
    
    // If browser doesn't support ReadableStream, fall back to regular fetch
    if (!response.body) {
      console.warn('ReadableStream not supported in this browser');
      return await response.arrayBuffer();
    }
    
    const reader = response.body.getReader();
    let receivedLength = 0;
    let chunks = [];
    
    // Function to process stream chunks
    async function processStream() {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        chunks.push(value);
        receivedLength += value.length;
        
        // Calculate and report progress
        const progress = Math.round((receivedLength / contentLength) * 100);
        onProgress(progress);
      }
      
      // Concatenate chunks into a single Uint8Array
      let chunksAll = new Uint8Array(receivedLength);
      let position = 0;
      for (let chunk of chunks) {
        chunksAll.set(chunk, position);
        position += chunk.length;
      }
      
      return chunksAll.buffer;
    }
    
    return await processStream();
  } catch (error) {
    console.error('Error in fetchWithProgress:', error);
    // If anything fails, fall back to regular fetch
    const response = await fetch(url);
    return await response.arrayBuffer();
  }
}

/**
 * Preload WASM files needed by ONNX Runtime
 * @param {function} onProgress - Progress callback
 * @returns {Promise<void>}
 */
export async function preloadWasmFiles(onProgress) {
  // List of WASM files needed by ONNX Runtime
  const wasmFiles = [
    '/risk-cancer/ort-wasm.wasm',
    '/risk-cancer/ort-wasm-simd.wasm',
    '/risk-cancer/ort-wasm-threaded.wasm',
  ];
  
  // Try to fetch each file to ensure it's in the browser cache
  for (let i = 0; i < wasmFiles.length; i++) {
    try {
      // Report progress based on which file we're loading
      const baseProgress = (i / wasmFiles.length) * 100;
      
      await fetchWithProgress(wasmFiles[i], (fileProgress) => {
        // Scale the progress to the overall progress
        const scaledProgress = baseProgress + (fileProgress / wasmFiles.length);
        onProgress(Math.round(scaledProgress));
      });
    } catch (error) {
      console.warn(`Failed to preload ${wasmFiles[i]}:`, error);
      // Continue with the next file
    }
  }
}
