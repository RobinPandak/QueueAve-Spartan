import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { EventDashboard } from './event-dashboard'
import { UnifiedDashboard } from './unified-dashboard'
import { getTrend, parseTimeToSeconds, secondsToMmss, type MetricResult, type MetricType } from '@/lib/progress'
import type { HeatCell, TodayResult } from './progress/heat-map'

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: event },
    { data: rawParticipants },
    { data: groups },
    { data: sessions },
    { data: templates },
  ] = await Promise.all([
    supabase.from('spartan_events').select('id, name, status, date, venue, organizer_id').eq('id', id).single(),
    supabase.from('spartan_participants').select('id, checked_in, group_id, status, player_id, spartan_players(id, name, email)').eq('event_id', id),
    supabase.from('spartan_groups').select('id, name').eq('event_id', id).order('sort_order'),
    supabase.from('spartan_sessions').select('*').eq('event_id', id).order('session_date'),
    supabase.from('spartan_session_templates').select('*, spartan_metrics(*)').eq('event_id', id),
  ])

  const participants = (rawParticipants ?? []).map(p => {
    const player = p.spartan_players as any
    return { id: p.id, player_id: p.player_id, checked_in: p.checked_in, group_id: p.group_id, status: p.status, name: player?.name ?? '', email: player?.email ?? null }
  }).sort((a, b) => a.name.localeCompare(b.name))

  if (!event) notFound()

  const isOwner = user?.id === event.organizer_id

  if (!isOwner) {
    return (
      <EventDashboard
        event={event}
        participants={participants}
        groups={groups ?? []}
        isOwner={false}
      />
    )
  }

  // ── Owner: compute progress data for UnifiedDashboard ──
  let results: any[] = []
  if (sessions && sessions.length > 0) {
    const { data: r } = await supabase
      .from('spartan_results')
      .select('*, spartan_sessions(session_date)')
      .in('session_id', sessions.map((s: any) => s.id))
    results = r ?? []
  }

  const allMetrics: any[] = templates?.flatMap(t => (t.spartan_metrics as any[]) ?? []) ?? []
  const uniqueMetrics = allMetrics.filter((m, i, arr) => arr.findIndex((x: any) => x.id === m.id) === i)

  function getMetricResults(participantId: string, metricId: string): MetricResult[] {
    return results
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

  const approved = participants.filter(p => p.status === 'approved')

  const participantStats = approved.map(p => {
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

  const metrics = uniqueMetrics.map((m: any) => ({ id: m.id, name: m.name, type: m.type as 'time' | 'count' | 'pass_fail' }))

  const cells: HeatCell[] = approved.flatMap(p =>
    uniqueMetrics.map((m: any): HeatCell => {
      const pResults = getMetricResults(p.id, m.id)
      if (!pResults.length) return { participantId: p.id, metricId: m.id, latest: null, trend: 'none' }
      const trend = getTrend(pResults, m.type as MetricType)
      const latest = getLatestValue(pResults, m.type as MetricType)
      return { participantId: p.id, metricId: m.id, latest, trend }
    })
  )

  const todayResults: TodayResult[] = (() => {
    const today = new Date().toISOString().split('T')[0]
    const todaySession = sessions?.find((s: any) => s.session_date === today)
    if (!todaySession) return []
    return results
      .filter(r => r.session_id === todaySession.id)
      .map((r): TodayResult => ({
        participantId: r.participant_id,
        metricId: r.metric_id,
        timeValue: r.time_value,
        countValue: r.count_value,
        passValue: r.pass_value,
      }))
  })()

  return (
    <UnifiedDashboard
      event={event}
      participants={participants}
      groups={groups ?? []}
      metrics={metrics}
      cells={cells}
      todayResults={todayResults}
      participantStats={participantStats}
      mostImproved={mostImproved}
      mostConsistent={mostConsistent}
      needsAttention={needsAttention}
    />
  )
}
