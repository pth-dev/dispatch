const BLOCKED_HTML_TAGS = 'script,iframe,object,embed,base,meta[http-equiv="refresh" i]'
const UNSAFE_URI_RE = /^\s*(javascript|vbscript|data):/i

/**
 * Strips executable elements/handlers and injects a strict CSP meta tag
 * before rendering archived report HTML in an isolated tab or iframe.
 */
export function hardenArchivedReportHtml(rawHtml: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(rawHtml, 'text/html')

  for (const el of Array.from(doc.querySelectorAll(BLOCKED_HTML_TAGS))) {
    el.remove()
  }

  for (const el of Array.from(doc.querySelectorAll('*'))) {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase()
      if (name.startsWith('on')) {
        el.removeAttribute(attr.name)
      } else if (
        (name === 'href' || name === 'src' || name === 'action' || name === 'formaction') &&
        UNSAFE_URI_RE.test(attr.value)
      ) {
        el.removeAttribute(attr.name)
      }
    }
  }

  const cspMeta = doc.createElement('meta')
  cspMeta.setAttribute('http-equiv', 'Content-Security-Policy')
  cspMeta.setAttribute('content', "script-src 'none'; object-src 'none'; base-uri 'none';")
  doc.head.prepend(cspMeta)

  return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`
}

export function triggerTextFileDownload(
  content: string,
  filename: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
}
