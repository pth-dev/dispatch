import { describe, expect, it } from 'vitest'
import { officeHtmlToText, plainClipboardToText } from './rich-paste'

describe('rich-paste', () => {
  it('converts tab-separated Excel plain text into pipe-delimited table rows', () => {
    const tsv = 'Item\tOwner\tStatus\nSwitch\tAlice\tDone\n'
    expect(plainClipboardToText(tsv)).toBe('| Item | Owner | Status |\n| Switch | Alice | Done |')
  })

  it('converts Word/Excel HTML tables and lists into clean structured text', () => {
    const html = `
      <table>
        <tr><th>Col A</th><th>Col B</th></tr>
        <tr><td>Val 1</td><td>Val 2</td></tr>
      </table>
      <ul><li>First</li><li>Second</li></ul>
    `
    const result = officeHtmlToText(html)
    expect(result).toContain('| Col A | Col B |')
    expect(result).toContain('| Val 1 | Val 2 |')
    expect(result).toContain('• First')
    expect(result).toContain('• Second')
  })
})
