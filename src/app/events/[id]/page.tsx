import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { EventDashboard } from './event-dashboard'
import { LiveView } from './live-view'

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: event },
    { data: participants },
    { data: groups },
    { data: sessions },
  ] = await Promise.all([
    supabase.from('spartan_events').select('id, name, status, date, venue, organizer_id').eq('id', id).single(),
    supabase.from('spartan_participants').select('id, name, checked_in, group_id, status, email').eq('event_id', id).order('name'),
    supabase.from('spartan_groups').select('id, name').eq('event_id', id).order('sort_order'),
    supabase.from('spartan_sessions').select('id').eq('event_id', id),
  ])

  if (!event) notFound()

  const isOwner = user?.id === event.organizer_id
  const sessionCount = sessions?.length ?? 0

  if (event.status === 'in_progress' && isOwner) {
    return (
      <LiveView
        event={event}
        participants={participants ?? []}
        groups={groups ?? []}
        sessionCount={sessionCount}
      />
    )
  }

  return (
    <EventDashboard
      event={event}
      participants={participants ?? []}
      groups={groups ?? []}
      sessionCount={sessionCount}
      isOwner={isOwner}
    />
  )
}
