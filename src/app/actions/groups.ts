'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function assertOwner(supabase: Awaited<ReturnType<typeof createClient>>, eventId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: event } = await supabase.from('spartan_events').select('organizer_id').eq('id', eventId).single()
  if (!event || event.organizer_id !== user.id) throw new Error('Unauthorized')
  return user
}

export async function createGroup(eventId: string, name: string, startTime?: string) {
  const supabase = await createClient()
  await assertOwner(supabase, eventId)
  const { data: existing } = await supabase
    .from('spartan_groups')
    .select('sort_order')
    .eq('event_id', eventId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()
  const sort_order = (existing?.sort_order ?? 0) + 1
  await supabase.from('spartan_groups').insert({ event_id: eventId, name, start_time: startTime || null, sort_order })
  revalidatePath(`/events/${eventId}/groups`)
}

export async function updateGroup(groupId: string, eventId: string, name: string, startTime?: string) {
  const supabase = await createClient()
  await assertOwner(supabase, eventId)
  await supabase.from('spartan_groups').update({ name, start_time: startTime || null }).eq('id', groupId)
  revalidatePath(`/events/${eventId}/groups`)
}

export async function deleteGroup(groupId: string, eventId: string) {
  const supabase = await createClient()
  await assertOwner(supabase, eventId)
  await supabase.from('spartan_groups').delete().eq('id', groupId)
  revalidatePath(`/events/${eventId}/groups`)
}
