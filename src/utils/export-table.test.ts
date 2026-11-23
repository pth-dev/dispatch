import { describe, expect, it } from 'vitest'
import { buildCsvContent, buildTsvContent, sanitizeSpreadsheetCell } from './export-table'

describe('export-table', () => {
  it('neutralizes formula injection prefixes', () => {
    expect(sanitizeSpreadsheetCell('=SUM(A1:A2)')).toBe("'=SUM(A1:A2)")
    expect(sanitizeSpreadsheetCell('+123')).toBe("'+123")
    expect(sanitizeSpreadsheetCell('-cmd')).toBe("'-cmd")
    expect(sanitizeSpreadsheetCell('@hack')).toBe("'@hack")
    expect(sanitizeSpreadsheetCell('Normal text')).toBe('Normal text')
    expect(sanitizeSpreadsheetCell(null)).toBe('')
  })

  it('builds UTF-8 BOM CSV with proper quoting', () => {
    const csv = buildCsvContent(
      ['Name', 'Note'],
      [
        ['Alice', 'Hello, "world"'],
        ['Bob', '=1+1'],
      ],
    )
    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv).toBe('\uFEFFName,Note\r\nAlice,"Hello, ""world"""\r\nBob,\'=1+1')
  })

  it('builds TSV flattening tabs and newlines', () => {
    const tsv = buildTsvContent(['ID', 'Summary'], [[101, 'Line 1\nLine 2\tTab']])
    expect(tsv).toBe('ID\tSummary\n101\tLine 1 Line 2 Tab')
  })
})
