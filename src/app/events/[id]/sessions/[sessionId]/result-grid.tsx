'use client'
import { useState } from 'react'
import { saveResults } from '@/app/actions/sessions'

type Participant = { id: string; name: string }
type Metric = { id: string; name: string; type: string; unit?: string | null }
type Result = { participant_id: string; metric_id: string; time_value?: string | null; count_value?: number | null; pass_value?: boolean | null }

type Props = {
  sessionId: string
  eventId: string
  participants: Participant[]
  metrics: Metric[]
  existingResults: Result[]
}

function parseResult(result: Result | undefined, metricType: string): string | boolean {
  if (!result) return metricType === 'pass_fail' ? false : ''
  if (metricType === 'time') return result.time_value ?? ''
  if (metricType === 'count') return result.count_value != null ? String(result.count_value) : ''
  if (metricType === 'pass_fail') return result.pass_value ?? false
  return ''
}

export function ResultGrid({ sessionId, eventId, participants, metrics, existingResults }: Props) {
  const initValues: Record<string, Record<string, string | boolean>> = {}
  for (const p of participants) {
    initValues[p.id] = {}
    for (const m of metrics) {
      const existing = existingResults.find(r => r.participant_id === p.id && r.metric_id === m.id)
      initValues[p.id][m.id] = parseResult(existing, m.type)
    }
  }

  const [values, setValues] = useState(initValues)
  const [saving, setSaving] = useState(false)

  const setValue = (pId: string, mId: string, val: string | boolean) =>
    setValues(v => ({ ...v, [pId]: { ...v[pId], [mId]: val } }))

  const handleSave = async () => {
    setSaving(true)
    const entries = participants.flatMap(p =>
      metrics.map(m => ({
        participantId: p.id,
        metricId: m.id,
        metricType: m.type as 'time' | 'count' | 'pass_fail',
        value: values[p.id]?.[m.id] ?? null,
      }))
    )
    await saveResults(sessionId, eventId, entries)
  }

  const cellStyle = { borderColor: 'var(--border)', color: 'var(--fg)' }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="text-left p-3 font-semibold border-b" style={cellStyle}>Participant</th>
            {metrics.map(m => (
              <th key={m.id} className="text-left p-3 font-semibold border-b whitespace-nowrap" style={cellStyle}>
                {m.name}{m.unit ? ` (${m.unit})` : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {participants.map(p => (
            <tr key={p.id} className="border-b" style={{ borderColor: 'var(--border)' }}>
              <td className="p-3 font-medium">{p.name}</td>
              {metrics.map(m => (
                <td key={m.id} className="p-2">
                  {m.type === 'pass_fail' ? (
                    <button
                      onClick={() => setValue(p.id, m.id, !values[p.id]?.[m.id])}
                      className="w-10 h-10 rounded-lg font-bold text-lg cursor-pointer transition-colors"
                      style={{
                        backgroundColor: values[p.id]?.[m.id] ? 'rgba(0,191,165,0.15)' : 'var(--subtle)',
                        color: values[p.id]?.[m.id] ? '#00BFA5' : 'var(--muted)',
                      }}
                    >{values[p.id]?.[m.id] ? '✓' : '✗'}</button>
                  ) : (
                    <input
                      className="w-24 px-2 py-1.5 rounded-lg border text-sm font-mono"
                      style={{ backgroundColor: 'var(--subtle)', borderColor: 'var(--border)', color: 'var(--fg)' }}
                      value={(values[p.id]?.[m.id] as string) ?? ''}
                      onChange={e => setValue(p.id, m.id, e.target.value)}
                      placeholder={m.type === 'time' ? 'mm:ss' : '0'}
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 rounded-xl text-white font-semibold cursor-pointer disabled:opacity-40"
          style={{ backgroundColor: '#FF6B4A' }}
        >{saving ? 'Saving...' : 'Save Results'}</button>
      </div>
    </div>
  )
}
