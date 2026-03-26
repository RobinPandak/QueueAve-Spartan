import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { parseTimeToSeconds, secondsToMmss } from '@/lib/progress'

export const revalidate = 30

export default async function LeaderboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: event } = await supabase.from('spartan_events').select('*').eq('id', id).single()
  if (!event || event.status === 'draft') notFound()

  const { data: sessions } = await supabase.from('spartan_sessions').select('*, spartan_session_templates(name), spartan_groups(name)').eq('event_id', id).order('session_date', { ascending: false })

  // Get latest session's results for leaderboard
  const latestSession = sessions?.[0]
  if (!latestSession) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>No sessions recorded yet.</p>
      </div>
    )
  }

  const { data: metrics } = await supabase.from('spartan_metrics').select('*').eq('template_id', latestSession.template_id).order('sort_order')
  const { data: results } = await supabase.from('spartan_results').select('*, spartan_participants(name)').eq('session_id', latestSession.id)

  const tmpl = latestSession.spartan_session_templates as any
  const group = latestSession.spartan_groups as any

  return (
    <div className="min-h-screen px-4 py-8 max-w-3xl mx-auto" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="text-center mb-8">
        <img src="/logo.svg" alt="Spartan" width="48" height="48" className="mx-auto mb-3" />
        <h1 className="text-2xl font-extrabold">{event.name}</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Leaderboard</p>
      </div>

      <div className="p-4 rounded-xl border mb-6" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
        <p className="text-sm font-semibold">{tmpl?.name} · {new Date(latestSession.session_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
        {group && <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{group.name}</p>}
      </div>

      {metrics?.map(metric => {
        const metricResults = (results ?? [])
          .filter(r => r.metric_id === metric.id)
          .map(r => ({
            name: (r.spartan_participants as any)?.name ?? 'Unknown',
            raw: metric.type === 'time'
              ? parseTimeToSeconds(r.time_value)
              : metric.type === 'count' ? r.count_value
              : r.pass_value ? 1 : 0,
            display: metric.type === 'time' && r.time_value
              ? secondsToMmss(parseTimeToSeconds(r.time_value)!)
              : metric.type === 'count' ? `${r.count_value}${metric.unit ? ` ${metric.unit}` : ''}`
              : r.pass_value ? 'Pass' : 'Fail',
          }))
          .filter(r => r.raw !== null)
          .sort((a, b) => metric.type === 'time' ? (a.raw! - b.raw!) : (b.raw! - a.raw!))

        if (!metricResults.length) return null
        return (
          <div key={metric.id} className="mb-6 p-5 rounded-2xl border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
            <h2 className="font-bold mb-4">{metric.name}</h2>
            <div className="space-y-2">
              {metricResults.map((r, i) => (
                <div key={r.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black w-6 text-right" style={{ color: i === 0 ? '#FFB800' : 'var(--muted)' }}>{i + 1}</span>
                    <span className="font-medium text-sm">{r.name}</span>
                  </div>
                  <span className="font-mono text-sm font-bold">{r.display}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
