import { describe, expect, it } from 'vitest'
import {
  DEFAULT_TASK_LEVEL,
  STANDARD_TASK_TYPES,
  formatBilingualOption,
  isStandardTaskType,
} from './task-catalog'
import { buildDefaultTaskEditorValues, buildTaskFormData } from './build-task-form-data'

describe('task-catalog', () => {
  it('contains all 15 legacy standard task types and identifies custom types', () => {
    expect(STANDARD_TASK_TYPES).toHaveLength(15)
    expect(isStandardTaskType('網路類 / Mạng lưới')).toBe(true)
    expect(isStandardTaskType('维护数据库 / Bảo trì cơ sở dữ liệu')).toBe(true)
    expect(isStandardTaskType('Loại tuỳ chỉnh riêng')).toBe(false)
  })

  it('formats bilingual labels per active language while preserving raw DB values', () => {
    expect(formatBilingualOption('網路類 / Mạng lưới', 'vi')).toBe('Mạng lưới')
    expect(formatBilingualOption('網路類 / Mạng lưới', 'zh-CN')).toBe('網路類')
    expect(formatBilingualOption('網路類 / Mạng lưới', 'zh-TW')).toBe('網路類')
    expect(formatBilingualOption('網路類 / Mạng lưới', 'en')).toBe('Mạng lưới (網路類)')
    expect(formatBilingualOption('Outlook / Outlook', 'vi')).toBe('Outlook')
  })

  it('sets task_type_is_custom=1 only for non-standard task types and uses legacy level default', () => {
    const defaults = buildDefaultTaskEditorValues(null)
    expect(defaults.level).toBe(DEFAULT_TASK_LEVEL)

    const standardFd = buildTaskFormData({
      mode: 'create',
      values: { ...defaults, title: 'T1', task_type: '網路類 / Mạng lưới' },
      reporter: 'hieu',
      newFiles: [],
    })
    expect(standardFd.get('task_type_is_custom')).toBe('0')

    const customFd = buildTaskFormData({
      mode: 'create',
      values: { ...defaults, title: 'T2', task_type: 'Bảo trì máy in' },
      reporter: 'hieu',
      newFiles: [],
    })
    expect(customFd.get('task_type_is_custom')).toBe('1')
  })
})
