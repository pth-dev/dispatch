import * as React from 'react'

export interface KpiNotice {
  tone: 'success' | 'error'
  message: string
}

export function useKpiNotice() {
  const [notice, setNotice] = React.useState<KpiNotice | null>(null)
  const timerRef = React.useRef<number | null>(null)

  function showNotice(tone: 'success' | 'error', message: string) {
    setNotice({ tone, message })
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
    }
    timerRef.current = window.setTimeout(() => {
      setNotice(null)
      timerRef.current = null
    }, 3500)
  }

  React.useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [])

  return { notice, showNotice }
}
