import type * as React from 'react'

const BLANK_LINE_SENTINEL = '__DISPATCH_BLANK_LINE__'

const BLOCK_TAGS = new Set([
  'P',
  'DIV',
  'SECTION',
  'ARTICLE',
  'HEADER',
  'FOOTER',
  'BLOCKQUOTE',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'CENTER',
  'ADDRESS',
  'FIGURE',
  'FIGCAPTION',
  'DL',
  'DT',
  'DD',
])

type RenderCtx = {
  depth: number
  pre: boolean
}

function renderChildren(node: Element, ctx: RenderCtx): string {
  let out = ''
  for (const child of Array.from(node.childNodes)) {
    out += renderNode(child, ctx)
  }
  return out
}

function renderTable(table: Element, ctx: RenderCtx): string {
  const rows = Array.from(table.querySelectorAll('tr'))
  if (rows.length === 0) return ''

  const grid: string[][] = []
  rows.forEach((tr, rIdx) => {
    const rowArr = grid[rIdx] ?? (grid[rIdx] = [])
    let colIdx = 0
    for (const cell of Array.from(tr.children)) {
      if (cell.tagName !== 'TD' && cell.tagName !== 'TH') continue
      while (rowArr[colIdx] !== undefined) colIdx += 1

      const raw = renderChildren(cell, { ...ctx, pre: false })
        .replace(/\u00a0/g, ' ')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .join(' / ')
        .replace(/\|/g, '｜')

      const colSpan = Math.min(50, Math.max(1, Number(cell.getAttribute('colspan')) || 1))
      const rowSpan = Math.min(50, Math.max(1, Number(cell.getAttribute('rowspan')) || 1))
      for (let r = 0; r < rowSpan; r++) {
        const target = grid[rIdx + r] ?? (grid[rIdx + r] = [])
        for (let c = 0; c < colSpan; c++) {
          target[colIdx + c] = r === 0 && c === 0 ? raw : ''
        }
      }
      colIdx += colSpan
    }
  })

  const maxCols = grid.reduce((max, r) => Math.max(max, r.length), 0)
  if (maxCols === 0) return ''

  return grid
    .map((r) => {
      const cells: string[] = []
      for (let c = 0; c < maxCols; c++) {
        cells.push((r[c] ?? '').trim())
      }
      return `| ${cells.join(' | ')} |`
    })
    .join('\n')
}

function renderList(list: Element, ctx: RenderCtx, ordered: boolean): string {
  const indent = '  '.repeat(ctx.depth)
  const items = Array.from(list.children).filter((c) => c.tagName === 'LI')
  return items
    .map((li, idx) => {
      const prefix = ordered ? `${idx + 1}. ` : '• '
      const text = renderChildren(li, { ...ctx, depth: ctx.depth + 1 })
        .replace(/^\n+|\n+$/g, '')
      return `${indent}${prefix}${text}`
    })
    .join('\n')
}

function renderNode(node: Node, ctx: RenderCtx): string {
  if (node.nodeType === 3) {
    const val = node.nodeValue ?? ''
    if (ctx.pre) return val
    return val.replace(/[\r\n]+/g, ' ').replace(/[ \t]{2,}/g, ' ')
  }
  if (node.nodeType !== 1) return ''
  const el = node as Element
  const tag = el.tagName.toUpperCase()
  if (tag === 'BR') return '\n'
  if (tag === 'IMG') return ''
  if (tag === 'TABLE') return `\n${renderTable(el, ctx)}\n`
  if (tag === 'UL' || tag === 'OL') return `\n${renderList(el, ctx, tag === 'OL')}\n`
  if (tag === 'PRE') return `\n${renderChildren(el, { ...ctx, pre: true })}\n`
  if (tag === 'HR') return `\n${'-'.repeat(20)}\n`

  let inner = renderChildren(el, ctx)
  if (tag === 'A') {
    const href = el.getAttribute('href') || ''
    if (/^https?:\/\//i.test(href) && !inner.includes(href)) {
      inner = inner.trim() ? `${inner.trim()} (${href})` : href
    }
  }
  if (BLOCK_TAGS.has(tag)) {
    const style = el.getAttribute('style') || ''
    if (tag === 'P' && /mso-list/i.test(style)) {
      inner = inner.replace(/^\s*[·•§o▪■◦]\s+/, '• ')
      const lvl = (style.match(/level(\d+)/i) || [])[1]
      if (lvl && Number(lvl) > 1) {
        inner = '  '.repeat(Number(lvl) - 1) + inner.trim()
      }
    }
    if (!inner.replace(/\u00a0/g, ' ').trim()) return `\n${BLANK_LINE_SENTINEL}\n`
    return `\n${inner}\n`
  }
  return inner
}

/** Converts tab-separated plain text (e.g., copied Excel cells) into pipe-delimited table rows. */
export function plainClipboardToText(plain: string): string {
  let text = String(plain || '').replace(/\r\n?/g, '\n')
  if (text.includes('\t')) {
    const lines = text.split('\n')
    while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop()
    text = lines
      .map(
        (line) =>
          `| ${line
            .split('\t')
            .map((cell) => cell.trim().replace(/\|/g, '｜'))
            .join(' | ')} |`,
      )
      .join('\n')
  }
  return text
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\n+|\s+$/g, '')
}

/** Converts Word / Excel HTML clipboard fragments into clean structured plain text. */
export function officeHtmlToText(html: string): string {
  const cleaned = String(html || '')
    .replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
  const doc = new DOMParser().parseFromString(cleaned, 'text/html')
  if (!doc?.body) return ''
  doc.body.querySelectorAll('style,script,meta,link,title,xml,head,noscript').forEach((n) => n.remove())
  doc.body.querySelectorAll('[style]').forEach((n) => {
    const st = (n.getAttribute('style') || '').replace(/\s+/g, '').toLowerCase()
    if (st.includes('display:none') || st.includes('mso-hide:all') || st.includes('visibility:hidden')) {
      n.remove()
    }
  })

  return renderNode(doc.body, { depth: 0, pre: false })
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+(?=[^\s•\d|])/g, '\n')
    .replace(/^([ ]*(?:•|\d+[.)]))[ ]{2,}/gm, '$1 ')
    .replace(/\n{2,}/g, '\n')
    .split(BLANK_LINE_SENTINEL)
    .join('')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s*\n/, '')
    .replace(/\s+$/, '')
}

export function clipboardHasText(cd: DataTransfer | null | undefined): boolean {
  if (!cd) return false
  try {
    return Boolean((cd.getData('text/plain') || '').trim() || (cd.getData('text/html') || '').trim())
  } catch {
    return false
  }
}

/**
 * Handles rich paste on a controlled/RHF textarea:
 * - If clipboard contains ONLY files/images (e.g., screenshot), forwards them to `onPasteFiles`.
 * - If clipboard contains Word/Excel HTML table/list or TSV plain text, formats and inserts at caret.
 */
export function handleRichTextareaPaste(
  e: React.ClipboardEvent<HTMLTextAreaElement>,
  options: {
    currentValue: string
    onValueChange: (next: string) => void
    onPasteFiles?: (files: File[]) => void
  },
): void {
  const cd = e.clipboardData
  if (!cd) return

  const files = Array.from(cd.files ?? [])
  const hasText = clipboardHasText(cd)

  if (files.length > 0 && !hasText) {
    if (options.onPasteFiles) {
      e.preventDefault()
      options.onPasteFiles(files)
    }
    return
  }

  const html = cd.getData('text/html') || ''
  const plain = cd.getData('text/plain') || ''
  const isRichHtml = /<(table|ul|ol)\b|mso-list|urn:schemas-microsoft-com:office/i.test(html)
  const isTsv = plain.includes('\t')

  if (!isRichHtml && !isTsv) return

  const converted = isRichHtml ? officeHtmlToText(html) : plainClipboardToText(plain)
  if (!converted) return

  e.preventDefault()
  const el = e.currentTarget
  const start = el.selectionStart ?? options.currentValue.length
  const end = el.selectionEnd ?? options.currentValue.length
  const next = `${options.currentValue.slice(0, start)}${converted}${options.currentValue.slice(end)}`
  options.onValueChange(next)
}
