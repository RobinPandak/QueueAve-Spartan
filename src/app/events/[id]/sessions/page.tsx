import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function SessionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: event } = await supabase.from('spartan_events').select('*').eq('id', id).single()
  if (!event) notFound()
  const { data: sessions } = await supabase
    .from('spartan_sessions')
    .select('*, spartan_session_templates(name), spartan_groups(name)')
    .eq('event_id', id)
    .order('session_date', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href={`/events/${id}`} className="text-sm cursor-pointer" style={{ color: 'var(--muted)' }}>← {event.name}</Link>
          <h2 className="text-2xl font-extrabold mt-1">Sessions</h2>
        </div>
        <Link href={`/events/${id}/sessions/new`}
          className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm cursor-pointer"
          style={{ backgroundColor: '#FF6B4A' }}>
          Record Session
        </Link>
      </div>

      <div className="space-y-2">
        {sessions?.map(session => (
          <Link key={session.id} href={`/events/${id}/sessions/${session.id}`}
            className="flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
            <div>
              <p className="font-medium text-sm">{(session.spartan_session_templates as { name: string } | null)?.name}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                {new Date(session.session_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {(session.spartan_groups as { name: string } | null)?.name ? ` · ${(session.spartan_groups as { name: string }).name}` : ' · All groups'}
              </p>
            </div>
          </Link>
        ))}
        {!sessions?.length && (
          <p className="text-sm text-center py-8" style={{ color: 'var(--muted)' }}>No sessions yet.</p>
        )}
      </div>
    </div>
  )
}
