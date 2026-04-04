'use server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { sendRegistrationEmail, sendEventGuideEmail } from '@/lib/email'

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
  revalidatePath(`/events/${eventId}`)
}

export async function findParticipantByEmail(eventId: string, email: string): Promise<{ id: string } | { error: string }> {
  const service = serviceClient()

  // 1. Check if already registered for this event
  const { data: existing } = await service
    .from('spartan_participants')
    .select('id, status')
    .eq('event_id', eventId)
    .ilike('email', email.trim())
    .maybeSingle()

  if (existing) {
    if (!existing.status || existing.status === 'pending') return { error: "You're already registered and waiting for coach approval. Check your email for your QR code." }
    if (existing.status === 'rejected') return { error: 'Your registration was not accepted. Please contact the coach.' }
    return { id: existing.id }
  }

  // 2. Not in this event — look up player profile across all events
  const { data: profile } = await service
    .from('spartan_participants')
    .select('name, email, phone, social_handle, avatar_url')
    .ilike('email', email.trim())
    .eq('status', 'approved')
    .limit(1)
    .maybeSingle()

  if (!profile) return { error: 'No player profile found with that email. Create your profile to join.' }

  // 3. Auto-register for this event using existing profile data
  const { data: newP, error: insertError } = await service
    .from('spartan_participants')
    .insert({
      event_id: eventId,
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      social_handle: profile.social_handle,
      avatar_url: profile.avatar_url,
      status: 'approved',
    })
    .select()
    .single()

  if (insertError || !newP) return { error: 'Failed to join event. Please try again.' }

  // 4. Send registration email for the new event (non-blocking)
  if (profile.email) {
    const { data: event } = await service
      .from('spartan_events')
      .select('name, date, start_time, venue')
      .eq('id', eventId)
      .single()

    const host = process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '') ?? 'spartan.queueave.com'
    const profileUrl = `https://${host.replace('localhost:3001', 'spartan.queueave.com')}/p/${newP.id}`
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(profileUrl)}&bgcolor=ffffff&color=1A1A1A&margin=12`

    sendRegistrationEmail({
      to: profile.email,
      name: profile.name,
      eventName: event?.name ?? 'Spartan Event',
      eventDate: event?.date ?? null,
      eventStartTime: event?.start_time ?? null,
      eventVenue: event?.venue ?? null,
      profileUrl,
      qrUrl,
    })
  }

  revalidatePath(`/events/${eventId}`)
  return { id: newP.id }
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

export async function uploadAvatar(participantId: string, formData: FormData): Promise<{ error: string } | { url: string }> {
  const file = formData.get('file') as File | null
  if (!file || file.size === 0) return { error: 'No file provided.' }
  const service = serviceClient()
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${participantId}.${ext}`
  const bytes = await file.arrayBuffer()
  const { error: uploadError } = await service.storage
    .from('spartan-avatars')
    .upload(path, bytes, { upsert: true, contentType: file.type })
  if (uploadError) return { error: uploadError.message }
  const { data: { publicUrl } } = service.storage.from('spartan-avatars').getPublicUrl(path)
  const { error: dbError } = await service.from('spartan_participants').update({ avatar_url: publicUrl }).eq('id', participantId)
  if (dbError) return { error: dbError.message }
  return { url: publicUrl + '?t=' + Date.now() }
}

export async function addParticipantManually(
  eventId: string,
  name: string,
  email: string | null,
  groupId: string | null,
): Promise<{ error: string } | { ok: true }> {
  if (!name.trim()) return { error: 'Name is required.' }
  const service = serviceClient()
  const { data: existing } = await service
    .from('spartan_participants')
    .select('id')
    .eq('event_id', eventId)
    .ilike('name', name.trim())
    .maybeSingle()
  if (existing) return { error: 'Someone with this name is already registered.' }
  const { error } = await service
    .from('spartan_participants')
    .insert({ event_id: eventId, name: name.trim(), email: email || null, group_id: groupId || null, status: 'approved' })
  if (error) return { error: 'Failed to add athlete.' }
  revalidatePath(`/events/${eventId}`)
  return { ok: true }
}

export async function removeParticipant(participantId: string, eventId: string): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { error } = await supabase.from('spartan_participants').delete().eq('id', participantId)
  if (error) return { error: 'Failed to remove athlete.' }
  revalidatePath(`/events/${eventId}`)
  return { ok: true }
}

export async function approveAllParticipants(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  await supabase.from('spartan_participants').update({ status: 'approved' }).eq('event_id', eventId).or('status.is.null,status.eq.pending')
  revalidatePath(`/events/${eventId}`)
}

export async function sendEventGuide(
  eventId: string,
  guide: { arrivalNote: string; parkingNote: string; accessNote: string; repName: string },
): Promise<{ sent: number; skipped: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const service = serviceClient()
  const [{ data: participants }, { data: event }] = await Promise.all([
    service.from('spartan_participants').select('name, email').eq('event_id', eventId).eq('status', 'approved'),
    service.from('spartan_events').select('name, date, start_time, venue').eq('id', eventId).single(),
  ])
  let sent = 0, skipped = 0
  for (const p of participants ?? []) {
    if (!p.email) { skipped++; continue }
    try {
      await sendEventGuideEmail({
        to: p.email,
        name: p.name,
        eventName: event?.name ?? 'Spartan Event',
        eventDate: event?.date ?? null,
        eventStartTime: event?.start_time ?? null,
        eventVenue: event?.venue ?? null,
        ...guide,
      })
      sent++
    } catch { skipped++ }
  }
  return { sent, skipped }
}

export async function reassignGroup(participantId: string, eventId: string, groupId: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  await supabase.from('spartan_participants').update({ group_id: groupId }).eq('id', participantId)
  revalidatePath(`/events/${eventId}/participants`)
}
