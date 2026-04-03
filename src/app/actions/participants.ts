'use server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { sendRegistrationEmail } from '@/lib/email'

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

  // Send registration email (non-blocking)
  if (email) {
    const { data: event } = await service
      .from('spartan_events')
      .select('name, date, start_time, venue')
      .eq('id', eventId)
      .single()

    const host = process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '') ?? 'spartan.queueave.com'
    const profileUrl = `https://${host.replace('localhost:3001', 'spartan.queueave.com')}/p/${data.id}`
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(profileUrl)}&bgcolor=ffffff&color=1A1A1A&margin=12`

    sendRegistrationEmail({
      to: email,
      name: name.trim(),
      eventName: event?.name ?? 'Spartan Event',
      eventDate: event?.date ?? null,
      eventStartTime: event?.start_time ?? null,
      eventVenue: event?.venue ?? null,
      profileUrl,
      qrUrl,
    })
  }

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
