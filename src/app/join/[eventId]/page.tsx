import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { JoinEntry } from './join-entry'

export default async function JoinPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const supabase = await createClient()

  const [{ data: event }, { data: groups }] = await Promise.all([
    supabase.from('spartan_events').select('id, name, date, venue, description, status, social_platform').eq('id', eventId).single(),
    supabase.from('spartan_groups').select('id, name, start_time').eq('event_id', eventId).order('sort_order'),
  ])

  if (!event || event.status !== 'open') notFound()

  return <JoinEntry event={event} groups={groups ?? []} />
}
