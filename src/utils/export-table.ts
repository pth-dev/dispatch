const FORMULA_PREFIX = /^[=+\-@\t\r\n]/

export type ExportCellValue = string | number | boolean | null | undefined

/**
 * Neutralizes spreadsheet formula injection (CSV/TSV) per security guidelines.
 */
export function sanitizeSpreadsheetCell(value: ExportCellValue): string {
  if (value == null) return ''
  const text = String(value)
  if (!text) return ''
  return FORMULA_PREFIX.test(text) ? `'${text}` : text
}

function escapeCsvField(raw: string): string {
  if (/[",\r\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`
  }
  return raw
}

/**
 * Builds a UTF-8 BOM CSV string compatible with Excel on Windows & macOS.
 */
export function buildCsvContent(
  headers: readonly string[],
  rows: readonly (readonly ExportCellValue[])[],
): string {
  const headerLine = headers.map((h) => escapeCsvField(sanitizeSpreadsheetCell(h))).join(',')
  const bodyLines = rows.map((row) =>
    row.map((cell) => escapeCsvField(sanitizeSpreadsheetCell(cell))).join(','),
  )
  return `\uFEFF${[headerLine, ...bodyLines].join('\r\n')}`
}

/**
 * Triggers a browser download of a UTF-8 BOM CSV file.
 */
export function exportTableToCsv(
  filename: string,
  headers: readonly string[],
  rows: readonly (readonly ExportCellValue[])[],
): void {
  const safeName = filename.endsWith('.csv') ? filename : `${filename}.csv`
  const csv = buildCsvContent(headers, rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  try {
    const link = document.createElement('a')
    link.href = url
    link.download = safeName
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * Builds a tab-separated string suitable for pasting directly into Excel or WeCom.
 */
export function buildTsvContent(
  headers: readonly string[],
  rows: readonly (readonly ExportCellValue[])[],
): string {
  const normalize = (value: ExportCellValue) => {
    if (value == null) return ''
    const flattened = String(value).replace(/[\t\r\n]+/g, ' ').trim()
    return sanitizeSpreadsheetCell(flattened)
  }
  const headerLine = headers.map(normalize).join('\t')
  const bodyLines = rows.map((row) => row.map(normalize).join('\t'))
  return [headerLine, ...bodyLines].join('\n')
}

export async function copyTableToClipboard(
  headers: readonly string[],
  rows: readonly (readonly ExportCellValue[])[],
): Promise<boolean> {
  const tsv = buildTsvContent(headers, rows)
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(tsv)
      return true
    } catch {
      return false
    }
  }
  return false
}
