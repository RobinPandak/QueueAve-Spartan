import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ResultGrid } from './result-grid'
import Link from 'next/link'

export default async function SessionPage({ params }: { params: Promise<{ id: string; sessionId: string }> }) {
  const { id, sessionId } = await params
  const supabase = await createClient()

  const { data: session } = await supabase
    .from('spartan_sessions')
    .select('*, spartan_session_templates(name), spartan_groups(name)')
    .eq('id', sessionId).single()
  if (!session) notFound()

  const { data: metrics } = await supabase
    .from('spartan_metrics')
    .select('*')
    .eq('template_id', session.template_id)
    .order('sort_order')

  // Get participants for this session's group (or all participants if group_id is null)
  const participantsQuery = supabase.from('spartan_participants').select('*').eq('event_id', id).order('name')
  if (session.group_id) participantsQuery.eq('group_id', session.group_id)
  const { data: participants } = await participantsQuery

  const { data: existingResults } = await supabase
    .from('spartan_results')
    .select('*')
    .eq('session_id', sessionId)

  const tmpl = session.spartan_session_templates as { name: string } | null
  const group = session.spartan_groups as { name: string } | null

  return (
    <div>
      <Link href={`/events/${id}/sessions`} className="text-sm cursor-pointer" style={{ color: 'var(--muted)' }}>← Sessions</Link>
      <div className="flex items-center gap-3 mt-2 mb-6">
        <h2 className="text-2xl font-extrabold">{tmpl?.name}</h2>
        <span className="text-sm" style={{ color: 'var(--muted)' }}>
          {new Date(session.session_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          {group ? ` · ${group.name}` : ' · All groups'}
        </span>
      </div>

      <ResultGrid
        sessionId={sessionId}
        eventId={id}
        participants={participants ?? []}
        metrics={metrics ?? []}
        existingResults={existingResults ?? []}
      />
    </div>
  )
}
