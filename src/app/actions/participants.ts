'use server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
  )
}

export async function registerParticipant(
  eventId: string,
  name: string,
  groupId: string | null,
  email: string | null = null,
  phone: string | null = null,
  socialHandle: string | null = null,
): Promise<{ error: string } | never> {
  if (!name.trim()) return { error: 'Name is required.' }
  if (!email?.trim()) return { error: 'Email is required.' }

  const service = serviceClient()

  // Duplicate name check (case-insensitive)
  const { data: existing } = await service
    .from('spartan_participants')
    .select('id')
    .eq('event_id', eventId)
    .ilike('name', name.trim())
    .maybeSingle()

  if (existing) return { error: 'Someone with this name is already registered.' }

  const { data, error } = await service
    .from('spartan_participants')
    .insert({
      event_id: eventId,
      name: name.trim(),
      group_id: groupId || null,
      email: email || null,
      phone: phone || null,
      social_handle: socialHandle || null,
    })
    .select()
    .single()

  if (error || !data) return { error: 'Registration failed. Please try again.' }
  redirect(`/p/${data.id}`)
}

export async function toggleCheckIn(participantId: string, eventId: string, checkedIn: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  await supabase
    .from('spartan_participants')
    .update({
      checked_in: checkedIn,
      checked_in_at: checkedIn ? new Date().toISOString() : null,
    })
    .eq('id', participantId)
  revalidatePath(`/events/${eventId}/participants`)
}

export async function findParticipantByEmail(eventId: string, email: string): Promise<{ id: string } | { error: string }> {
  const service = serviceClient()
  const { data } = await service
    .from('spartan_participants')
    .select('id')
    .eq('event_id', eventId)
    .ilike('email', email.trim())
    .maybeSingle()
  if (!data) return { error: 'No participant found with that email for this event.' }
  return { id: data.id }
}

export async function approveParticipant(participantId: string, eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  await supabase.from('spartan_participants').update({ status: 'approved' }).eq('id', participantId)
  revalidatePath(`/events/${eventId}`)
}

export async function rejectParticipant(participantId: string, eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  await supabase.from('spartan_participants').update({ status: 'rejected' }).eq('id', participantId)
  revalidatePath(`/events/${eventId}`)
}

export async function reassignGroup(participantId: string, eventId: string, groupId: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  await supabase.from('spartan_participants').update({ group_id: groupId }).eq('id', participantId)
  revalidatePath(`/events/${eventId}/participants`)
}
