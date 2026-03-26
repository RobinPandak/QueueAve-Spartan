import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { getTrend, TREND_COLOR, TREND_LABEL, type MetricResult, type MetricType } from '@/lib/progress'
import Link from 'next/link'

export default async function ProgressPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: event } = await supabase.from('spartan_events').select('*').eq('id', id).single()
  if (!event) notFound()

  const { data: participants } = await supabase.from('spartan_participants').select('*').eq('event_id', id).order('name')
  const { data: sessions } = await supabase.from('spartan_sessions').select('*').eq('event_id', id).order('session_date')
  const { data: templates } = await supabase.from('spartan_session_templates').select('*, spartan_metrics(*)').eq('event_id', id)
  const { data: results } = await supabase.from('spartan_results').select('*, spartan_sessions(session_date)').in('session_id', sessions?.map(s => s.id) ?? [])

  const allMetrics: any[] = templates?.flatMap(t => (t.spartan_metrics as any[]) ?? []) ?? []
  const uniqueMetrics = allMetrics.filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i)

  return (
    <div>
      <div className="mb-6">
        <Link href={`/events/${id}`} className="text-sm cursor-pointer" style={{ color: 'var(--muted)' }}>← {event.name}</Link>
        <h2 className="text-2xl font-extrabold mt-1">Progress Dashboard</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left p-3 font-semibold border-b" style={{ borderColor: 'var(--border)' }}>Participant</th>
              {uniqueMetrics.map(m => (
                <th key={m.id} className="text-left p-3 font-semibold border-b whitespace-nowrap" style={{ borderColor: 'var(--border)' }}>{m.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {participants?.map(p => (
              <tr key={p.id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                <td className="p-3">
                  <Link href={`/events/${id}/progress/${p.id}`} className="font-medium cursor-pointer hover:text-[#FF6B4A]">{p.name}</Link>
                </td>
                {uniqueMetrics.map(m => {
                  const pResults: MetricResult[] = (results ?? [])
                    .filter(r => r.participant_id === p.id && r.metric_id === m.id)
                    .map(r => ({
                      sessionDate: (r.spartan_sessions as any)?.session_date ?? '',
                      sessionId: r.session_id,
                      timeValue: r.time_value,
                      countValue: r.count_value,
                      passValue: r.pass_value,
                    }))
                  if (!pResults.length) return <td key={m.id} className="p-3" style={{ color: 'var(--muted)' }}>—</td>
                  const trend = getTrend(pResults, m.type as MetricType)
                  return (
                    <td key={m.id} className="p-3">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${TREND_COLOR[trend]}22`, color: TREND_COLOR[trend] }}>
                        {TREND_LABEL[trend]}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
