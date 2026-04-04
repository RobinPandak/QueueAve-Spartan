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

function buildPlayerUrl(playerId: string) {
  const host = process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '') ?? 'spartan.queueave.com'
  const resolvedHost = host.replace('localhost:3001', 'spartan.queueave.com')
  return `https://${resolvedHost}/player/${playerId}`
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

  // Check if player with this email already exists
  const { data: existingPlayer } = await service
    .from('spartan_players')
    .select('id')
    .ilike('email', email.trim())
    .maybeSingle()

  let playerId: string

  if (existingPlayer) {
    playerId = existingPlayer.id
    // Check if already enrolled in this event
    const { data: existingEnrollment } = await service
      .from('spartan_participants')
      .select('id')
      .eq('event_id', eventId)
      .eq('player_id', playerId)
      .maybeSingle()
    if (existingEnrollment) return { error: 'You are already registered for this event.' }
  } else {
    // Check name uniqueness in this event
    const { data: enrollments } = await service
      .from('spartan_participants')
      .select('spartan_players(name)')
      .eq('event_id', eventId)
    const nameTaken = enrollments?.some(
      e => (e.spartan_players as any)?.name?.toLowerCase() === name.trim().toLowerCase()
    )
    if (nameTaken) return { error: 'Someone with this name is already registered.' }

    // Create new player
    const { data: newPlayer, error: playerError } = await service
      .from('spartan_players')
      .insert({ name: name.trim(), email: email.trim(), phone: phone || null, social_handle: socialHandle || null })
      .select()
      .single()
    if (playerError || !newPlayer) return { error: 'Registration failed. Please try again.' }
    playerId = newPlayer.id
  }

  // Enroll in event
  const { error: enrollError } = await service
    .from('spartan_participants')
    .insert({ event_id: eventId, player_id: playerId, group_id: groupId || null, status: 'approved' })
  if (enrollError) return { error: 'Registration failed. Please try again.' }

  // Send registration email (non-blocking)
  const { data: event } = await service
    .from('spartan_events')
    .select('name, date, start_time, venue')
    .eq('id', eventId)
    .single()

  const profileUrl = buildPlayerUrl(playerId)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(profileUrl)}&bgcolor=ffffff&color=1A1A1A&margin=12`

  sendRegistrationEmail({
    to: email.trim(),
    name: name.trim(),
    eventName: event?.name ?? 'Spartan Event',
    eventDate: event?.date ?? null,
    eventStartTime: event?.start_time ?? null,
    eventVenue: event?.venue ?? null,
    profileUrl,
    qrUrl,
  })

  redirect(`/player/${playerId}`)
}

export async function toggleCheckIn(participantId: string, eventId: string, checkedIn: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  await supabase
    .from('spartan_participants')
    .update({ checked_in: checkedIn, checked_in_at: checkedIn ? new Date().toISOString() : null })
    .eq('id', participantId)
  revalidatePath(`/events/${eventId}`)
}

export async function findParticipantByEmail(eventId: string, email: string): Promise<{ playerId: string } | { error: string }> {
  const service = serviceClient()

  // Find global player by email
  const { data: player } = await service
    .from('spartan_players')
    .select('id, name, email')
    .ilike('email', email.trim())
    .maybeSingle()

  if (!player) return { error: 'No player profile found with that email. Create your profile to join.' }

  // Check existing enrollment in this event
  const { data: enrollment } = await service
    .from('spartan_participants')
    .select('id, status')
    .eq('event_id', eventId)
    .eq('player_id', player.id)
    .maybeSingle()

  if (enrollment) {
    if (!enrollment.status || enrollment.status === 'pending')
      return { error: "You're already registered and waiting for coach approval. Check your email for your QR code." }
    if (enrollment.status === 'rejected')
      return { error: 'Your registration was not accepted. Please contact the coach.' }
    return { playerId: player.id }
  }

  // Auto-enroll in this event
  const { error: insertError } = await service
    .from('spartan_participants')
    .insert({ event_id: eventId, player_id: player.id, status: 'approved' })
  if (insertError) return { error: 'Failed to join event. Please try again.' }

  // Send registration email for the new event (non-blocking)
  if (player.email) {
    const { data: event } = await service
      .from('spartan_events')
      .select('name, date, start_time, venue')
      .eq('id', eventId)
      .single()
    const profileUrl = buildPlayerUrl(player.id)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(profileUrl)}&bgcolor=ffffff&color=1A1A1A&margin=12`
    sendRegistrationEmail({
      to: player.email,
      name: player.name,
      eventName: event?.name ?? 'Spartan Event',
      eventDate: event?.date ?? null,
      eventStartTime: event?.start_time ?? null,
      eventVenue: event?.venue ?? null,
      profileUrl,
      qrUrl,
    })
  }

  revalidatePath(`/events/${eventId}`)
  return { playerId: player.id }
}

export async function enrollPlayerById(playerId: string, eventId: string): Promise<{ ok: true } | { error: string }> {
  const service = serviceClient()

  const { data: player } = await service
    .from('spartan_players')
    .select('id')
    .eq('id', playerId)
    .maybeSingle()
  if (!player) return { error: 'Player not found.' }

  // Already enrolled?
  const { data: existing } = await service
    .from('spartan_participants')
    .select('id')
    .eq('event_id', eventId)
    .eq('player_id', playerId)
    .maybeSingle()
  if (existing) return { ok: true }

  // Check event is accepting registrations
  const { data: event } = await service
    .from('spartan_events')
    .select('status')
    .eq('id', eventId)
    .single()
  if (!event || event.status === 'completed') return { error: 'This event is not accepting registrations.' }

  const { error } = await service
    .from('spartan_participants')
    .insert({ event_id: eventId, player_id: playerId, status: 'approved' })
  if (error) return { error: 'Failed to join event.' }

  revalidatePath(`/events/${eventId}`)
  return { ok: true }
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

export async function uploadAvatar(playerId: string, formData: FormData): Promise<{ error: string } | { url: string }> {
  try {
    const file = formData.get('file') as File | null
    if (!file || file.size === 0) return { error: 'No file provided.' }
    const service = serviceClient()
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `avatars/${playerId}.${ext}`
    const bytes = await file.arrayBuffer()
    const { error: uploadError } = await service.storage
      .from('player-avatars')
      .upload(path, bytes, { upsert: true, contentType: file.type })
    if (uploadError) return { error: uploadError.message }
    const { data: { publicUrl } } = service.storage.from('player-avatars').getPublicUrl(path)
    const { error: dbError } = await service.from('spartan_players').update({ avatar_url: publicUrl }).eq('id', playerId)
    if (dbError) return { error: dbError.message }
    return { url: publicUrl + '?t=' + Date.now() }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Upload failed.' }
  }
}

export async function addParticipantManually(
  eventId: string,
  name: string,
  email: string | null,
  groupId: string | null,
): Promise<{ error: string } | { ok: true }> {
  if (!name.trim()) return { error: 'Name is required.' }
  const service = serviceClient()

  let playerId: string

  if (email?.trim()) {
    const { data: existingPlayer } = await service
      .from('spartan_players')
      .select('id')
      .ilike('email', email.trim())
      .maybeSingle()

    if (existingPlayer) {
      playerId = existingPlayer.id
      const { data: enrollment } = await service
        .from('spartan_participants')
        .select('id')
        .eq('event_id', eventId)
        .eq('player_id', playerId)
        .maybeSingle()
      if (enrollment) return { error: 'This athlete is already registered.' }
    } else {
      const { data: newPlayer, error } = await service
        .from('spartan_players')
        .insert({ name: name.trim(), email: email.trim() })
        .select()
        .single()
      if (error || !newPlayer) return { error: 'Failed to add athlete.' }
      playerId = newPlayer.id
    }
  } else {
    const { data: newPlayer, error } = await service
      .from('spartan_players')
      .insert({ name: name.trim() })
      .select()
      .single()
    if (error || !newPlayer) return { error: 'Failed to add athlete.' }
    playerId = newPlayer.id
  }

  const { error } = await service
    .from('spartan_participants')
    .insert({ event_id: eventId, player_id: playerId, group_id: groupId || null, status: 'approved' })
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
  const [{ data: enrollments }, { data: event }] = await Promise.all([
    service.from('spartan_participants')
      .select('spartan_players(name, email)')
      .eq('event_id', eventId)
      .eq('status', 'approved'),
    service.from('spartan_events').select('name, date, start_time, venue').eq('id', eventId).single(),
  ])
  let sent = 0, skipped = 0
  for (const e of enrollments ?? []) {
    const player = e.spartan_players as any
    if (!player?.email) { skipped++; continue }
    try {
      await sendEventGuideEmail({
        to: player.email,
        name: player.name,
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
