'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createSession(eventId: string, templateId: string, groupId: string | null, sessionDate: string, notes: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data, error } = await supabase.from('spartan_sessions')
    .insert({ event_id: eventId, template_id: templateId, group_id: groupId || null, session_date: sessionDate, notes: notes || null })
    .select().single()
  if (error || !data) throw new Error('Failed to create session')
  redirect(`/events/${eventId}/sessions/${data.id}`)
}

type ResultEntry = {
  participantId: string
  metricId: string
  metricType: 'time' | 'count' | 'pass_fail'
  value: string | boolean | null
}

export async function saveResults(sessionId: string, eventId: string, entries: ResultEntry[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const rows = entries
    .filter(e => e.value !== null && e.value !== '')
    .map(e => ({
      session_id: sessionId,
      participant_id: e.participantId,
      metric_id: e.metricId,
      time_value: e.metricType === 'time' ? (e.value as string) : null,
      count_value: e.metricType === 'count' ? parseInt(e.value as string) : null,
      pass_value: e.metricType === 'pass_fail' ? e.value as boolean : null,
    }))

  await supabase.from('spartan_results').upsert(rows, { onConflict: 'session_id,participant_id,metric_id' })
  revalidatePath(`/events/${eventId}/sessions/${sessionId}`)
  redirect(`/events/${eventId}/sessions/${sessionId}`)
}
