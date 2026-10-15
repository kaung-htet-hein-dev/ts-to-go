// Serves the static site from dist/. Only paths listed in run_worker_first
// reach this code; everything else is served by Workers static assets.

// Google Search Console needs this exact '.html' URL with no redirect, but
// asset html_handling would 307 it to the extensionless path.
const GOOGLE_VERIFY = '/google454e2ac404436ce8.html'

export default {
  fetch(request, env) {
    if (new URL(request.url).pathname === GOOGLE_VERIFY) {
      return new Response('google-site-verification: google454e2ac404436ce8.html', {
        headers: { 'content-type': 'text/html; charset=utf-8' },
      })
    }
    return env.ASSETS.fetch(request)
  },
}
