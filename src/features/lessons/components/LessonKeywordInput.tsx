import { useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LESSON_KEYWORD_MAX } from '@/schemas/lesson'
import { mergeKeywords, parseRawKeywordsInput } from '../utils/lesson-domain'

type LessonKeywordInputProps = {
  id: string
  keywords: string[]
  disabled?: boolean
  error?: string
  onChange: (next: string[]) => void
  onDraftChange?: (draft: string) => void
}

const DELIMITER_REGEX = /[,，、;；|\n]/

export function LessonKeywordInput({
  id,
  keywords,
  disabled = false,
  error,
  onChange,
  onDraftChange,
}: LessonKeywordInputProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [draft, setDraft] = useState('')
  const [limitNotice, setLimitNotice] = useState(false)

  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = error ? `${hintId} ${errorId}` : hintId

  const commitDraft = (rawValue: string) => {
    const parsed = parseRawKeywordsInput(rawValue)
    if (parsed.length === 0) {
      setDraft('')
      onDraftChange?.('')
      return
    }
    const { next, reachedLimit } = mergeKeywords(keywords, parsed, LESSON_KEYWORD_MAX)
    setLimitNotice(reachedLimit)
    onChange(next)
    setDraft('')
    onDraftChange?.('')
  }

  const handleInputChange = (value: string) => {
    if (DELIMITER_REGEX.test(value)) {
      commitDraft(value)
      return
    }
    setLimitNotice(false)
    setDraft(value)
    onDraftChange?.(value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === '，') {
      e.preventDefault()
      commitDraft(draft)
    } else if (e.key === 'Backspace' && draft.length === 0 && keywords.length > 0) {
      onChange(keywords.slice(0, -1))
      setLimitNotice(false)
    }
  }

  const handleRemove = (index: number) => {
    onChange(keywords.filter((_, idx) => idx !== index))
    setLimitNotice(false)
  }

  const handleContainerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      e.preventDefault()
      inputRef.current?.focus()
    }
  }

  return (
    <div className="space-y-1.5">
      <div
        onMouseDown={handleContainerMouseDown}
        className={`flex min-h-11 flex-wrap items-center gap-1.5 rounded-lg border bg-card px-2.5 py-1.5 transition-colors focus-within:ring-2 focus-within:ring-ring ${
          error ? 'border-destructive' : 'border-border'
        }`}
      >
        {keywords.map((kw, idx) => (
          <span
            key={`${kw}-${idx}`}
            className="inline-flex items-center gap-1 rounded-md border border-destructive/25 bg-destructive/5 py-0.5 pr-1 pl-2 text-xs font-medium text-destructive"
          >
            <span>{kw}</span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => handleRemove(idx)}
              aria-label={t('lessons.editor.removeKeyword', { keyword: kw })}
              className="inline-flex size-5 items-center justify-center rounded hover:bg-destructive/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          id={id}
          type="text"
          value={draft}
          disabled={disabled}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => commitDraft(draft)}
          placeholder={t('lessons.editor.keywordsPlaceholder')}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className="min-w-[10rem] flex-1 bg-transparent py-1 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>

      <p id={hintId} className="text-[11px] text-muted-foreground">
        {t('lessons.editor.keywordsHint', { max: LESSON_KEYWORD_MAX })}
      </p>

      {limitNotice && (
        <p role="alert" className="text-xs text-destructive">
          {t('lessons.validation.keywordsMax', { max: LESSON_KEYWORD_MAX })}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {t(error, { max: LESSON_KEYWORD_MAX })}
        </p>
      )}
    </div>
  )
}
