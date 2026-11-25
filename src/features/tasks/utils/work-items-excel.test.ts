import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import { parseWorkItemsArrayBuffer } from './work-items-excel'

describe('work-items-excel', () => {
  it('parses bilingual headers, skips sample rows, and reads Settings rule', async () => {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([
      [
        'STT',
        'Chủ đề công việc con *',
        'Nội dung công việc',
        'Lưu ý & rủi ro',
        'OU phụ trách',
        'Người phụ trách',
        'Người thay thế',
        'Bắt đầu',
        'Kết thúc',
        'Ngày trừ thêm',
      ],
      [
        1,
        '[Ví dụ] Bỏ qua dòng mẫu',
        'Sample',
        '',
        'IT',
        'alice',
        '',
        '2026-11-01 08:00',
        '2026-11-02 17:00',
        0,
      ],
      [
        2,
        'Triển khai mạng',
        'Cấu hình switch',
        'Gián đoạn ngắn',
        'BP. IT',
        'hieu',
        'nam',
        '2026-11-03 08:00',
        '2026-11-06 17:00',
        0.5,
      ],
    ])
    XLSX.utils.book_append_sheet(wb, ws, '工作专区 WorkItems')

    const settings = XLSX.utils.aoa_to_sheet([
      ['设置项目 / Mục', '值 / Giá trị'],
      ['扣除日规则 / Quy tắc ngày trừ', 'satsun'],
    ])
    XLSX.utils.book_append_sheet(wb, settings, '设置 Settings')

    const arrayBuf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
    const parsed = await parseWorkItemsArrayBuffer(arrayBuf, 'DEFAULT_OU')

    expect(parsed.skippedSamples).toBe(1)
    expect(parsed.rule).toBe('satsun')
    expect(parsed.items).toHaveLength(1)
    expect(parsed.items[0]).toMatchObject({
      topic: 'Triển khai mạng',
      content: 'Cấu hình switch',
      risk: 'Gián đoạn ngắn',
      owner_ou: 'BP. IT',
      owner: 'hieu',
      agent: 'nam',
      start: '2026-11-03T08:00',
      end: '2026-11-06T17:00',
      deduct: 0.5,
    })
  })
})
