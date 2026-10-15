// Writes one static HTML file per route into dist/ so crawlers and link
// previews get real content and per-page <head> tags without running JS.
// Run after `vite build` and `vite build --ssr src/entry-server.tsx`.
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const ssrDir = join(root, 'dist-ssr')

const { render, ALL_PATHS, SITE_URL } = await import(join(ssrDir, 'entry-server.js'))
const template = await readFile(join(dist, 'index.html'), 'utf8')
if (!template.includes('<!--head-->') || !template.includes('<div id="root"></div>')) {
  throw new Error('index.html is missing the <!--head--> marker or the empty #root div')
}

const page = (path, file) => {
  const { html, head } = render(path)
  return [file, template
    .replace('<!--head-->', head)
    .replace('<div id="root"></div>', `<div id="root" data-path="${path}">${html}</div>`)]
}

// '/lesson/x' -> dist/lesson/x.html, which Workers static assets serve at '/lesson/x'.
const files = ALL_PATHS.map(p => page(p, p === '/' ? 'index.html' : `${p.slice(1)}.html`))
files.push(page('/404', '404.html'))

for (const [file, html] of files) {
  const out = join(dist, file)
  await mkdir(dirname(out), { recursive: true })
  await writeFile(out, html)
}

const today = new Date().toISOString().slice(0, 10)
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${ALL_PATHS.map(p => `  <url><loc>${SITE_URL}${p}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`
await writeFile(join(dist, 'sitemap.xml'), sitemap)
await rm(ssrDir, { recursive: true, force: true })
console.log(`prerendered ${files.length} pages + sitemap.xml`)
