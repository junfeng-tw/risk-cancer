/**
 * Cloudflare Worker script for serving a static site
 */

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

/**
 * Respond to the request
 * @param {Request} request
 */
async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Serve static assets from the dist directory
  try {
    // Add a trailing slash to the URL if it doesn't have one
    if (url.pathname.endsWith('/risk-cancer')) {
      url.pathname += '/'
      return Response.redirect(url.toString(), 301)
    }
    
    // Serve index.html for the root path or any path that doesn't have a file extension
    if (url.pathname.endsWith('/') || !url.pathname.includes('.')) {
      return fetch(`${url.origin}/risk-cancer/index.html`)
    }
    
    // Serve the requested file
    return fetch(request)
  } catch (e) {
    return new Response('Not Found', { status: 404 })
  }
}
