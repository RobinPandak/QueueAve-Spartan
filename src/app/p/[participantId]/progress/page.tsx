import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { parseTimeToSeconds, secondsToMmss } from '@/lib/progress'
import Link from 'next/link'
import { ProgressCharts } from '@/components/progress-charts'

export default async function PersonalProgressPage({ params }: { params: Promise<{ participantId: string }> }) {
  const { participantId } = await params
  const supabase = await createClient()
  const { data: participant } = await supabase.from('spartan_participants').select('*, spartan_events(*)').eq('id', participantId).single()
  if (!participant) notFound()

  const event = participant.spartan_events as any
  const { data: templates } = await supabase.from('spartan_session_templates').select('*, spartan_metrics(*)').eq('event_id', event.id)
  const { data: results } = await supabase.from('spartan_results').select('*, spartan_sessions(session_date)').eq('participant_id', participantId)

  const allMetrics: any[] = templates?.flatMap(t => (t.spartan_metrics as any[]) ?? []) ?? []
  const uniqueMetrics = allMetrics.filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i)

  const chartData = uniqueMetrics.map(m => {
    const mResults = (results ?? [])
      .filter(r => r.metric_id === m.id)
      .map(r => ({
        date: (r.spartan_sessions as any)?.session_date ?? '',
        value: m.type === 'time' ? parseTimeToSeconds(r.time_value) : m.type === 'count' ? r.count_value : r.pass_value ? 1 : 0,
        label: m.type === 'time' && r.time_value ? secondsToMmss(parseTimeToSeconds(r.time_value)!) : String(m.type === 'count' ? r.count_value : r.pass_value ? 'Pass' : 'Fail'),
      }))
      .filter(r => r.value !== null)
      .sort((a: any, b: any) => a.date.localeCompare(b.date))
    return { metric: m, data: mResults }
  }).filter(c => c.data.length > 0)

  return (
    <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto" style={{ backgroundColor: 'var(--bg)' }}>
      <Link href={`/p/${participantId}`} className="text-sm cursor-pointer" style={{ color: 'var(--muted)' }}>← My Profile</Link>
      <h1 className="text-2xl font-extrabold mt-2 mb-2">My Progress</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>{event?.name}</p>
      <ProgressCharts chartData={chartData} />
    </div>
  )
}
