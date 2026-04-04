'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TrendingUp, TrendingDown, Minus, X, ChevronDown } from 'lucide-react'
import { TREND_COLOR } from '@/lib/progress'
import { saveAthleteResults } from '@/app/actions/sessions'

export type Metric = { id: string; name: string; type: 'time' | 'count' | 'pass_fail' }
export type Participant = { id: string; name: string }
export type Session = { id: string; session_date: string; template_id: string }
export type HeatCell = {
  participantId: string
  metricId: string
  latest: string | null
  trend: 'improving' | 'flat' | 'declining' | 'none'
}
export type RawResult = {
  sessionId: string
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
  sessions: Session[]
  cells: HeatCell[]
  rawResults: RawResult[]
}

function formatSessionDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function HeatMap({ eventId, participants, metrics, sessions, cells, rawResults }: Props) {
  const router = useRouter()
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  function openDrawer(p: Participant) {
    setSelectedParticipant(p)
    setDrawerOpen(true)
  }

  function closeDrawer() {
    setDrawerOpen(false)
    setTimeout(() => setSelectedParticipant(null), 300)
  }

  function getCell(participantId: string, metricId: string) {
    return cells.find(c => c.participantId === participantId && c.metricId === metricId)
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
                    onClick={() => openDrawer(p)}
                    className="hover:text-[#FF6B4A] transition-colors cursor-pointer text-left"
                  >
                    {p.name}
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
                      <div className="inline-flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl"
                        style={{ backgroundColor: `${color}18` }}>
                        <div className="flex items-center gap-1">
                          <TrendIcon className="w-3 h-3" style={{ color }} />
                          <span className="text-xs font-bold" style={{ color }}>{cell.latest ?? '—'}</span>
                        </div>
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Drawer overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 flex justify-end" onClick={closeDrawer}>
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,.3)' }} />
          <div
            className="relative z-50 w-full max-w-sm h-full overflow-y-auto shadow-2xl"
            style={{ backgroundColor: 'var(--card)' }}
            onClick={e => e.stopPropagation()}
          >
            {selectedParticipant && (
              <AthleteDrawer
                eventId={eventId}
                participant={selectedParticipant}
                metrics={metrics}
                sessions={sessions}
                rawResults={rawResults.filter(r => r.participantId === selectedParticipant.id)}
                onClose={closeDrawer}
                onSaved={() => { closeDrawer(); router.refresh() }}
              />
            )}
          </div>
        </div>
      )}
    </>
  )
}

function AthleteDrawer({
  eventId, participant, metrics, sessions, rawResults, onClose, onSaved,
}: {
  eventId: string
  participant: Participant
  metrics: Metric[]
  sessions: Session[]
  rawResults: RawResult[]
  onClose: () => void
  onSaved: () => void
}) {
  const [sessionId, setSessionId] = useState(sessions[sessions.length - 1]?.id ?? '')
  const [values, setValues] = useState<Record<string, string | boolean | null>>({})
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // Pre-populate inputs when session changes
  useEffect(() => {
    const init: Record<string, string | boolean | null> = {}
    for (const m of metrics) {
      const r = rawResults.find(r => r.sessionId === sessionId && r.metricId === m.id)
      if (!r) { init[m.id] = null; continue }
      if (m.type === 'time') init[m.id] = r.timeValue ?? null
      else if (m.type === 'count') init[m.id] = r.countValue != null ? String(r.countValue) : null
      else init[m.id] = r.passValue ?? null
    }
    setValues(init)
  }, [sessionId, rawResults, metrics])

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
      const result = await saveAthleteResults(sessionId, eventId, participant.id, entries)
      if ('error' in result) {
        setError(result.error)
      } else {
        setSaved(true)
        setTimeout(onSaved, 800)
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
          <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--muted)' }}>Enter Results</p>
          <h3 className="text-base font-bold" style={{ color: 'var(--fg)' }}>{participant.name}</h3>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:opacity-70 cursor-pointer" style={{ color: 'var(--muted)' }}>
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 px-5 py-4 space-y-5 overflow-y-auto">
        {/* Session selector */}
        {sessions.length === 0 ? (
          <div className="rounded-xl p-4 text-center text-sm space-y-2" style={{ backgroundColor: 'var(--subtle)', color: 'var(--muted)' }}>
            <p>No sessions yet.</p>
            <Link href={`/events/${eventId}/sessions/new`} className="text-[#FF6B4A] font-semibold hover:opacity-75">
              Create a session first
            </Link>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted)' }}>
              Session
            </label>
            <div className="relative">
              <select
                value={sessionId}
                onChange={e => setSessionId(e.target.value)}
                className={`${inputCls} appearance-none pr-8 cursor-pointer`}
                style={inputSty}
              >
                {[...sessions].reverse().map(s => (
                  <option key={s.id} value={s.id}>{formatSessionDate(s.session_date)}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--muted)' }} />
            </div>
          </div>
        )}

        {/* Metrics */}
        {sessions.length > 0 && (
          <div className="space-y-4">
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
                    placeholder={m.type === 'time' ? 'mm:ss' : m.type === 'count' ? '0' : ''}
                    value={(values[m.id] as string) ?? ''}
                    onChange={e => setValue(m.id, e.target.value || null)}
                    className={inputCls}
                    style={inputSty}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="text-xs px-3 py-2 rounded-xl" style={{ backgroundColor: 'rgba(229,72,77,.1)', color: '#E5484D' }}>{error}</p>
        )}
      </div>

      {/* Footer */}
      {sessions.length > 0 && (
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
        </div>
      )}
    </div>
  )
}
