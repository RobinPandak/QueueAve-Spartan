import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EventsList, type EventCard } from './events-list'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: organizer }, { data: events }] = await Promise.all([
    supabase.from('organizers').select('name').eq('id', user.id).single(),
    supabase
      .from('spartan_events')
      .select('id, name, date, venue, status')
      .eq('organizer_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const eventIds = (events ?? []).map(e => e.id)
  const participantCounts: Record<string, number> = {}
  if (eventIds.length > 0) {
    const { data: counts } = await supabase
      .from('spartan_participants')
      .select('event_id')
      .in('event_id', eventIds)
    for (const row of counts ?? []) {
      participantCounts[row.event_id] = (participantCounts[row.event_id] ?? 0) + 1
    }
  }

  const eventCards: EventCard[] = (events ?? []).map(e => ({
    id: e.id,
    name: e.name,
    date: e.date,
    venue: e.venue,
    status: e.status as 'draft' | 'open' | 'completed',
    participant_count: participantCounts[e.id] ?? 0,
  }))

  return <EventsList events={eventCards} coachName={organizer?.name ?? ''} />
}
