'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp, TrendingDown, Minus, X, Sparkles } from 'lucide-react'
import { TREND_COLOR } from '@/lib/progress'
import { saveAthleteResults } from '@/app/actions/sessions'
import { getAthleteFeedback } from '@/app/actions/ai'

export type Metric = { id: string; name: string; type: 'time' | 'count' | 'pass_fail' }
export type Participant = { id: string; name: string }
export type HeatCell = {
  participantId: string
  metricId: string
  latest: string | null
  trend: 'improving' | 'flat' | 'declining' | 'none'
}
export type TodayResult = {
  participantId: string
  metricId: string
  timeValue: string | null
  countValue: number | null
  passValue: boolean | null
}

type Props = {
  eventId: string
  participants: Participant[]
  metrics: Metric[]
  cells: HeatCell[]
  todayResults: TodayResult[]
}

export function HeatMap({ eventId, participants, metrics, cells, todayResults }: Props) {
  const router = useRouter()
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null)

  function getCell(participantId: string, metricId: string) {
    return cells.find(c => c.participantId === participantId && c.metricId === metricId)
  }

  function closeDrawer() {
    setSelectedParticipant(null)
  }

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ backgroundColor: 'var(--subtle)' }}>
              <th className="text-left px-4 py-3 font-semibold whitespace-nowrap" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)', minWidth: '140px' }}>
                Athlete
              </th>
              {metrics.map(m => (
                <th key={m.id} className="text-center px-3 py-3 font-semibold whitespace-nowrap" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)', minWidth: '110px' }}>
                  {m.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {participants.map((p, pi) => (
              <tr key={p.id} style={{ borderTop: pi > 0 ? '1px solid var(--border)' : undefined }}>
                <td className="px-4 py-3 font-medium whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => setSelectedParticipant(p)}
                    className="transition-all cursor-pointer text-left flex items-center gap-1.5 group"
                  >
                    <span className="text-[#FF6B4A] font-semibold group-hover:underline">{p.name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-md font-medium opacity-70 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: 'rgba(255,107,74,.1)', color: '#FF6B4A' }}>
                      + results
                    </span>
                  </button>
                </td>
                {metrics.map(m => {
                  const cell = getCell(p.id, m.id)
                  if (!cell || cell.trend === 'none') {
                    return (
                      <td key={m.id} className="px-3 py-3 text-center">
                        <span style={{ color: 'var(--muted)' }}>—</span>
                      </td>
                    )
                  }
                  const color = TREND_COLOR[cell.trend as keyof typeof TREND_COLOR]
                  const TrendIcon = cell.trend === 'improving' ? TrendingUp : cell.trend === 'declining' ? TrendingDown : Minus
                  return (
                    <td key={m.id} className="px-3 py-2 text-center">
                      <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl" style={{ backgroundColor: `${color}18` }}>
                        <TrendIcon className="w-3 h-3" style={{ color }} />
                        <span className="text-xs font-bold" style={{ color }}>{cell.latest ?? '—'}</span>
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Drawer */}
      {selectedParticipant && (
        <div className="fixed inset-0 z-40 flex justify-end" onClick={closeDrawer}>
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,.3)' }} />
          <div
            className="relative z-50 w-full max-w-sm h-full overflow-y-auto shadow-2xl"
            style={{ backgroundColor: 'var(--card)' }}
            onClick={e => e.stopPropagation()}
          >
            <AthleteDrawer
              eventId={eventId}
              participant={selectedParticipant}
              metrics={metrics}
              initialResults={todayResults.filter(r => r.participantId === selectedParticipant.id)}
              onClose={closeDrawer}
              onSaved={() => { closeDrawer(); router.refresh() }}
            />
          </div>
        </div>
      )}
    </>
  )
}

function AthleteDrawer({
  eventId, participant, metrics, initialResults, onClose, onSaved,
}: {
  eventId: string
  participant: Participant
  metrics: Metric[]
  initialResults: TodayResult[]
  onClose: () => void
  onSaved: () => void
}) {
  function initValues() {
    const v: Record<string, string | boolean | null> = {}
    for (const m of metrics) {
      const r = initialResults.find(r => r.metricId === m.id)
      if (!r) { v[m.id] = null; continue }
      if (m.type === 'time') v[m.id] = r.timeValue ?? null
      else if (m.type === 'count') v[m.id] = r.countValue != null ? String(r.countValue) : null
      else v[m.id] = r.passValue ?? null
    }
    return v
  }

  const [values, setValues] = useState<Record<string, string | boolean | null>>(initValues)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [showFeedbackPrompt, setShowFeedbackPrompt] = useState(false)
  const hasExistingResults = initialResults.length > 0

  // Auto-show feedback button when opening with existing results
  useEffect(() => {
    if (hasExistingResults) setShowFeedbackPrompt(false)
  }, [hasExistingResults])

  async function loadFeedback() {
    setFeedbackLoading(true)
    setShowFeedbackPrompt(false)
    const result = await getAthleteFeedback(participant.id, eventId)
    setFeedbackLoading(false)
    if ('feedback' in result) setFeedback(result.feedback)
    else setFeedback(`Could not load feedback: ${result.error}`)
  }

  function setValue(metricId: string, val: string | boolean | null) {
    setValues(v => ({ ...v, [metricId]: val }))
  }

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const entries = metrics.map(m => ({
        metricId: m.id,
        metricType: m.type,
        value: values[m.id] ?? null,
      }))
      const result = await saveAthleteResults(eventId, participant.id, entries)
      if ('error' in result) {
        setError(result.error)
      } else {
        setSaved(true)
        setShowFeedbackPrompt(true)
      }
    })
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/30'
  const inputSty = { backgroundColor: 'var(--subtle)', border: '1px solid var(--border)', color: 'var(--fg)' } as const

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--muted)' }}>
            Today's Results
          </p>
          <h3 className="text-base font-bold" style={{ color: 'var(--fg)' }}>{participant.name}</h3>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:opacity-70 cursor-pointer" style={{ color: 'var(--muted)' }}>
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 px-5 py-5 space-y-4 overflow-y-auto">

        {/* AI feedback button — shown if athlete has existing results */}
        {hasExistingResults && !feedback && !feedbackLoading && !showFeedbackPrompt && (
          <button
            type="button"
            onClick={loadFeedback}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80 cursor-pointer"
            style={{ backgroundColor: 'rgba(139,92,246,.1)', color: '#7C3AED', border: '1px solid rgba(139,92,246,.2)' }}
          >
            <Sparkles className="w-4 h-4" />
            Get AI coaching feedback
          </button>
        )}

        {/* After save: prompt to get updated feedback */}
        {showFeedbackPrompt && !feedback && (
          <div className="rounded-xl p-3 space-y-2" style={{ backgroundColor: 'rgba(139,92,246,.08)', border: '1px solid rgba(139,92,246,.2)' }}>
            <p className="text-xs font-medium" style={{ color: '#7C3AED' }}>Results saved. Want AI coaching feedback?</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={loadFeedback}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all hover:opacity-80"
                style={{ backgroundColor: '#7C3AED', color: 'white' }}
              >
                <Sparkles className="w-3.5 h-3.5" /> Yes, show me
              </button>
              <button
                type="button"
                onClick={() => { setShowFeedbackPrompt(false); setTimeout(onSaved, 100) }}
                className="flex-1 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all hover:opacity-70"
                style={{ backgroundColor: 'var(--subtle)', color: 'var(--muted)' }}
              >
                No thanks
              </button>
            </div>
          </div>
        )}

        {/* Loading state */}
        {feedbackLoading && (
          <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: 'rgba(139,92,246,.08)', border: '1px solid rgba(139,92,246,.2)' }}>
            <span className="w-4 h-4 border-2 rounded-full animate-spin flex-shrink-0" style={{ borderColor: 'rgba(124,58,237,.3)', borderTopColor: '#7C3AED' }} />
            <p className="text-xs" style={{ color: '#7C3AED' }}>Analyzing performance...</p>
          </div>
        )}

        {/* Feedback result */}
        {feedback && (
          <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: 'rgba(139,92,246,.08)', border: '1px solid rgba(139,92,246,.2)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5" style={{ color: '#7C3AED' }} />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#7C3AED' }}>AI Coach Feedback</p>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--fg)' }}>{feedback}</p>
            <button
              type="button"
              onClick={() => { setFeedback(null); if (saved) setTimeout(onSaved, 100) }}
              className="text-xs cursor-pointer hover:opacity-70 transition-opacity"
              style={{ color: 'var(--muted)' }}
            >
              Dismiss
            </button>
          </div>
        )}

        {metrics.map(m => (
          <div key={m.id}>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--fg)' }}>{m.name}</label>
            {m.type === 'pass_fail' ? (
              <div className="flex gap-2">
                {([true, false] as const).map(val => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => setValue(m.id, values[m.id] === val ? null : val)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                    style={values[m.id] === val
                      ? { backgroundColor: val ? 'rgba(0,191,165,.15)' : 'rgba(229,72,77,.1)', color: val ? '#00896E' : '#E5484D', border: `1px solid ${val ? '#00BFA5' : '#E5484D'}` }
                      : { backgroundColor: 'var(--subtle)', color: 'var(--muted)', border: '1px solid var(--border)' }
                    }
                  >
                    {val ? '✓ Pass' : '✗ Fail'}
                  </button>
                ))}
              </div>
            ) : (
              <input
                type={m.type === 'count' ? 'number' : 'text'}
                placeholder={m.type === 'time' ? 'mm:ss' : '0'}
                value={(values[m.id] as string) ?? ''}
                onChange={e => setValue(m.id, e.target.value || null)}
                className={inputCls}
                style={inputSty}
              />
            )}
          </div>
        ))}

        {error && (
          <p className="text-xs px-3 py-2 rounded-xl" style={{ backgroundColor: 'rgba(229,72,77,.1)', color: '#E5484D' }}>{error}</p>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || saved}
          className="w-full py-3 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer"
          style={{ backgroundColor: saved ? '#00BFA5' : '#FF6B4A' }}
        >
          {saved ? '✓ Saved' : isPending ? 'Saving...' : 'Save Results'}
        </button>
        {saved && !showFeedbackPrompt && !feedback && (
          <button
            type="button"
            onClick={onSaved}
            className="w-full mt-2 py-2 rounded-full text-xs font-medium cursor-pointer hover:opacity-70 transition-opacity"
            style={{ color: 'var(--muted)' }}
          >
            Close
          </button>
        )}
      </div>
    </div>
  )
}
