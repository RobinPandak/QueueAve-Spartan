'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export type WizardData = {
  name: string
  date: string
  start_time?: string
  venue?: string
  description?: string
  social_platform?: string
  groups: { name: string; start_time?: string }[]
  templates: {
    name: string
    metrics: { name: string; type: 'time' | 'count' | 'pass_fail'; unit?: string }[]
  }[]
}

export async function createEvent(data: WizardData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Create event
  const { data: event, error: eventError } = await supabase
    .from('spartan_events')
    .insert({
      name: data.name,
      date: data.date,
      start_time: data.start_time || null,
      venue: data.venue || null,
      description: data.description || null,
      social_platform: data.social_platform || 'instagram',
      organizer_id: user.id,
      status: 'open',
    })
    .select()
    .single()
  if (eventError || !event) throw new Error('Failed to create event')

  // Create groups
  for (let i = 0; i < data.groups.length; i++) {
    await supabase.from('spartan_groups').insert({
      event_id: event.id,
      name: data.groups[i].name,
      start_time: data.groups[i].start_time || null,
      sort_order: i + 1,
    })
  }

  // Create templates + metrics
  for (const tmpl of data.templates) {
    const { data: template } = await supabase
      .from('spartan_session_templates')
      .insert({ event_id: event.id, name: tmpl.name })
      .select()
      .single()
    if (!template) continue
    for (let j = 0; j < tmpl.metrics.length; j++) {
      await supabase.from('spartan_metrics').insert({
        template_id: template.id,
        name: tmpl.metrics[j].name,
        type: tmpl.metrics[j].type,
        unit: tmpl.metrics[j].unit || null,
        sort_order: j + 1,
      })
    }
  }

  redirect(`/events/${event.id}`)
}

export async function updateEventStatus(eventId: string, status: string): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  // Verify ownership first with authenticated client
  const { data: event } = await supabase.from('spartan_events').select('id').eq('id', eventId).eq('organizer_id', user.id).single()
  if (!event) return { error: 'Not authorized.' }
  // Use service client to bypass RLS for the update
  const { createClient: createServiceClient } = await import('@supabase/supabase-js')
  const service = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!)
  const { error } = await service.from('spartan_events').update({ status }).eq('id', eventId)
  if (error) return { error: error.message }
  revalidatePath(`/events/${eventId}`)
  return { ok: true }
}

export async function updateEvent(id: string, data: { name: string; date: string; start_time?: string; venue?: string; description?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  await supabase.from('spartan_events')
    .update({ name: data.name, date: data.date, start_time: data.start_time || null, venue: data.venue || null, description: data.description || null })
    .eq('id', id).eq('organizer_id', user.id)
  redirect(`/events/${id}`)
}
