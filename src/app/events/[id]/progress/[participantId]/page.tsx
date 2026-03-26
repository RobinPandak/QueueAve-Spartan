import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { parseTimeToSeconds, secondsToMmss } from '@/lib/progress'
import Link from 'next/link'
import { ProgressCharts } from '@/components/progress-charts'

export default async function ParticipantProgressPage({ params }: { params: Promise<{ id: string; participantId: string }> }) {
  const { id, participantId } = await params
  const supabase = await createClient()
  const { data: participant } = await supabase.from('spartan_participants').select('*').eq('id', participantId).single()
  if (!participant) notFound()

  const { data: templates } = await supabase.from('spartan_session_templates').select('*, spartan_metrics(*)').eq('event_id', id)
  const { data: results } = await supabase
    .from('spartan_results').select('*, spartan_sessions(session_date)')
    .eq('participant_id', participantId)

  const allMetrics: any[] = templates?.flatMap(t => (t.spartan_metrics as any[]) ?? []) ?? []
  const uniqueMetrics = allMetrics.filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i)

  const chartData = uniqueMetrics.map(m => {
    const mResults = (results ?? [])
      .filter(r => r.metric_id === m.id)
      .map(r => ({
        date: (r.spartan_sessions as any)?.session_date ?? '',
        value: m.type === 'time'
          ? parseTimeToSeconds(r.time_value)
          : m.type === 'count' ? r.count_value
          : r.pass_value ? 1 : 0,
        label: m.type === 'time' && r.time_value ? secondsToMmss(parseTimeToSeconds(r.time_value)!) : String(
          m.type === 'count' ? r.count_value : r.pass_value ? 'Pass' : 'Fail'
        ),
      }))
      .filter(r => r.value !== null)
      .sort((a, b) => a.date.localeCompare(b.date))
    return { metric: m, data: mResults }
  }).filter(c => c.data.length > 0)

  return (
    <div>
      <Link href={`/events/${id}/progress`} className="text-sm cursor-pointer" style={{ color: 'var(--muted)' }}>← Progress Dashboard</Link>
      <h2 className="text-2xl font-extrabold mt-2 mb-8">{participant.name}</h2>
      <ProgressCharts chartData={chartData} />
    </div>
  )
}
