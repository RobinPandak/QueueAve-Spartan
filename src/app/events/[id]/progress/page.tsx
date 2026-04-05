import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { getTrend, parseTimeToSeconds, secondsToMmss, TREND_COLOR, type MetricResult, type MetricType } from '@/lib/progress'
import Link from 'next/link'
import { TrendingUp, Zap, AlertTriangle, ArrowLeft } from 'lucide-react'
import { HeatMap, type HeatCell, type TodayResult } from './heat-map'

export default async function ProgressPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: event } = await supabase.from('spartan_events').select('*').eq('id', id).single()
  if (!event) notFound()

  const { data: rawParticipants } = await supabase.from('spartan_participants').select('id, spartan_players(name)').eq('event_id', id)
  const participants = (rawParticipants ?? []).map(p => ({ id: p.id, name: (p.spartan_players as any)?.name ?? '' })).sort((a, b) => a.name.localeCompare(b.name))
  const { data: sessions } = await supabase.from('spartan_sessions').select('*').eq('event_id', id).order('session_date')
  const { data: templates } = await supabase.from('spartan_session_templates').select('*, spartan_metrics(*)').eq('event_id', id)
  const { data: results } = await supabase.from('spartan_results').select('*, spartan_sessions(session_date)').in('session_id', sessions?.map(s => s.id) ?? [])

  const allMetrics: any[] = templates?.flatMap(t => (t.spartan_metrics as any[]) ?? []) ?? []
  const uniqueMetrics = allMetrics.filter((m, i, arr) => arr.findIndex((x: any) => x.id === m.id) === i)

  // Build results map per participant per metric
  function getMetricResults(participantId: string, metricId: string): MetricResult[] {
    return (results ?? [])
      .filter(r => r.participant_id === participantId && r.metric_id === metricId)
      .map(r => ({
        sessionDate: (r.spartan_sessions as any)?.session_date ?? '',
        sessionId: r.session_id,
        timeValue: r.time_value,
        countValue: r.count_value,
        passValue: r.pass_value,
      }))
      .sort((a, b) => a.sessionDate.localeCompare(b.sessionDate))
  }

  function getLatestValue(pResults: MetricResult[], type: MetricType): string | null {
    if (!pResults.length) return null
    const latest = pResults[pResults.length - 1]
    if (type === 'time') {
      const secs = parseTimeToSeconds(latest.timeValue)
      return secs !== null ? secondsToMmss(secs) : null
    }
    if (type === 'count') return latest.countValue != null ? String(latest.countValue) : null
    if (type === 'pass_fail') return latest.passValue === true ? '✓' : latest.passValue === false ? '✗' : null
    return null
  }

  // ── Summary card computations ──────────────────────────────────────
  type ParticipantStats = {
    id: string
    name: string
    improving: number
    declining: number
    total: number
  }

  const participantStats: ParticipantStats[] = (participants ?? []).map(p => {
    let improving = 0, declining = 0, total = 0
    for (const m of uniqueMetrics) {
      const pResults = getMetricResults(p.id, m.id)
      if (!pResults.length) continue
      total++
      const trend = getTrend(pResults, m.type as MetricType)
      if (trend === 'improving') improving++
      if (trend === 'declining') declining++
    }
    return { id: p.id, name: p.name, improving, declining, total }
  })

  const mostImproved = [...participantStats]
    .filter(p => p.total > 0)
    .sort((a, b) => b.improving - a.improving || a.declining - b.declining)[0] ?? null

  const mostConsistent = [...participantStats]
    .filter(p => p.total > 0)
    .sort((a, b) => (b.total - b.declining) - (a.total - a.declining))[0] ?? null

  const needsAttention = [...participantStats]
    .filter(p => p.total > 0 && p.declining > 0)
    .sort((a, b) => b.declining - a.declining)[0] ?? null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/events/${id}`} className="p-2.5 rounded-xl transition-colors hover:bg-[var(--subtle)]" style={{ color: 'var(--muted)' }}>
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>{event.name}</p>
          <h2 className="text-2xl font-extrabold leading-tight">Progress Dashboard</h2>
        </div>
      </div>

      {/* ── Summary cards (Option D) ── */}
      {participantStats.some(p => p.total > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Most Improved */}
          <div className="rounded-2xl p-5 space-y-3" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(0,191,165,.12)' }}>
              <TrendingUp className="w-5 h-5" style={{ color: '#00BFA5' }} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>Most Improved</p>
              {mostImproved ? (
                <>
                  <p className="text-base font-bold" style={{ color: 'var(--fg)' }}>{mostImproved.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#00896E' }}>
                    {mostImproved.improving} metric{mostImproved.improving !== 1 ? 's' : ''} improving
                  </p>
                </>
              ) : (
                <p className="text-sm" style={{ color: 'var(--muted)' }}>Not enough data</p>
              )}
            </div>
          </div>

          {/* Most Consistent */}
          <div className="rounded-2xl p-5 space-y-3" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,184,0,.12)' }}>
              <Zap className="w-5 h-5" style={{ color: '#FFB800' }} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>Most Consistent</p>
              {mostConsistent ? (
                <>
                  <p className="text-base font-bold" style={{ color: 'var(--fg)' }}>{mostConsistent.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#9B7800' }}>
                    {mostConsistent.total - mostConsistent.declining} of {mostConsistent.total} metrics on track
                  </p>
                </>
              ) : (
                <p className="text-sm" style={{ color: 'var(--muted)' }}>Not enough data</p>
              )}
            </div>
          </div>

          {/* Needs Attention */}
          <div className="rounded-2xl p-5 space-y-3" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(229,72,77,.1)' }}>
              <AlertTriangle className="w-5 h-5" style={{ color: '#E5484D' }} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>Needs Attention</p>
              {needsAttention ? (
                <>
                  <p className="text-base font-bold" style={{ color: 'var(--fg)' }}>{needsAttention.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#E5484D' }}>
                    {needsAttention.declining} metric{needsAttention.declining !== 1 ? 's' : ''} declining
                  </p>
                </>
              ) : (
                <p className="text-sm" style={{ color: '#00896E' }}>Everyone on track</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Heat map grid ── */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>
          Athlete Heat Map
        </h3>

        {uniqueMetrics.length === 0 || !participants?.length ? (
          <div className="text-center py-10 rounded-2xl border" style={{ borderColor: 'var(--border)', borderStyle: 'dashed' }}>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>No session data yet. Record a session to see progress.</p>
          </div>
        ) : (
          <HeatMap
            eventId={id}
            participants={participants}
            metrics={uniqueMetrics.map((m: any) => ({ id: m.id, name: m.name, type: m.type as 'time' | 'count' | 'pass_fail' }))}
            cells={participants.flatMap(p =>
              uniqueMetrics.map((m: any): HeatCell => {
                const pResults = getMetricResults(p.id, m.id)
                if (!pResults.length) return { participantId: p.id, metricId: m.id, latest: null, trend: 'none' }
                const trend = getTrend(pResults, m.type as MetricType)
                const latest = getLatestValue(pResults, m.type as MetricType)
                return { participantId: p.id, metricId: m.id, latest, trend }
              })
            )}
            todayResults={(() => {
              const today = new Date().toISOString().split('T')[0]
              const todaySession = sessions?.find(s => s.session_date === today)
              if (!todaySession) return []
              return (results ?? [])
                .filter(r => r.session_id === todaySession.id)
                .map((r): TodayResult => ({
                  participantId: r.participant_id,
                  metricId: r.metric_id,
                  timeValue: r.time_value,
                  countValue: r.count_value,
                  passValue: r.pass_value,
                }))
            })()}
          />
        )}

        {/* Legend */}
        {uniqueMetrics.length > 0 && participants?.length > 0 && (
          <div className="flex items-center gap-4 mt-3 px-1">
            {[
              { color: TREND_COLOR.improving, label: 'Improving' },
              { color: TREND_COLOR.flat,      label: 'No change' },
              { color: TREND_COLOR.declining, label: 'Declining' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: `${l.color}40` }} />
                <span className="text-xs" style={{ color: 'var(--muted)' }}>{l.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
