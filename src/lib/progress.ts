export type MetricResult = {
  sessionDate: string
  sessionId: string
  timeValue?: string | null
  countValue?: number | null
  passValue?: boolean | null
}

export type MetricType = 'time' | 'count' | 'pass_fail'

/** Parse "mm:ss" interval string to total seconds */
export function parseTimeToSeconds(val: string | null | undefined): number | null {
  if (!val) return null
  // Postgres interval may return "00:04:23" (HH:MM:SS) or "04:23" (MM:SS)
  const parts = val.replace(/\s/g, '').split(':').map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return null
}

/** Format seconds to "mm:ss" */
export function secondsToMmss(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Get numeric value from a result for comparison (null = no data) */
export function getNumericValue(result: MetricResult, type: MetricType): number | null {
  if (type === 'time') return parseTimeToSeconds(result.timeValue)
  if (type === 'count') return result.countValue ?? null
  if (type === 'pass_fail') return result.passValue === true ? 1 : result.passValue === false ? 0 : null
  return null
}

/** Returns 'improving' | 'flat' | 'declining' based on last 3 data points */
export function getTrend(results: MetricResult[], type: MetricType): 'improving' | 'flat' | 'declining' {
  const sorted = [...results].sort((a, b) => a.sessionDate.localeCompare(b.sessionDate))
  const values = sorted.map(r => getNumericValue(r, type)).filter((v): v is number => v !== null)
  if (values.length < 2) return 'flat'
  const recent = values.slice(-3)
  const first = recent[0]
  const last = recent[recent.length - 1]
  const delta = last - first
  if (Math.abs(delta) < 1e-9) return 'flat'
  // For time: lower is better → negative delta = improving
  if (type === 'time') return delta < 0 ? 'improving' : 'declining'
  return delta > 0 ? 'improving' : 'declining'
}

export const TREND_COLOR = { improving: '#00BFA5', flat: '#FFB800', declining: '#FF6B4A' }
export const TREND_LABEL = { improving: '↑ Improving', flat: '→ No change', declining: '↓ Declining' }
