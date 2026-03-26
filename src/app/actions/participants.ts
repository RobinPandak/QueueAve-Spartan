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

export async function registerParticipant(eventId: string, name: string, groupId: string | null) {
  const service = serviceClient()
  const { data, error } = await service
    .from('spartan_participants')
    .insert({
      event_id: eventId,
      name,
      group_id: groupId || null,
    })
    .select()
    .single()
  if (error || !data) throw new Error('Registration failed')
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

export async function reassignGroup(participantId: string, eventId: string, groupId: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  await supabase.from('spartan_participants').update({ group_id: groupId }).eq('id', participantId)
  revalidatePath(`/events/${eventId}/participants`)
}
