import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { updateEvent } from '@/app/actions/events'

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: event } = await supabase.from('spartan_events').select('*').eq('id', id).single()
  if (!event) notFound()

  async function handleSubmit(formData: FormData) {
    'use server'
    await updateEvent(id, {
      name: formData.get('name') as string,
      date: formData.get('date') as string,
      start_time: formData.get('start_time') as string,
      venue: formData.get('venue') as string,
      description: formData.get('description') as string,
    })
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-extrabold mb-8">Edit Event</h1>
      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Name</label>
          <input name="name" defaultValue={event.name} required
            className="w-full px-4 py-2.5 rounded-xl border text-sm"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--fg)' }} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Date</label>
          <input name="date" type="date" defaultValue={event.date} required
            className="w-full px-4 py-2.5 rounded-xl border text-sm"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--fg)' }} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Start time <span className="font-normal text-xs" style={{ color: 'var(--muted)' }}>optional</span></label>
          <input name="start_time" type="time" defaultValue={event.start_time ?? ''}
            className="w-full px-4 py-2.5 rounded-xl border text-sm"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--fg)' }} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Venue</label>
          <input name="venue" defaultValue={event.venue ?? ''} placeholder="Optional"
            className="w-full px-4 py-2.5 rounded-xl border text-sm"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--fg)' }} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Description</label>
          <textarea name="description" defaultValue={event.description ?? ''} rows={3} placeholder="Optional"
            className="w-full px-4 py-2.5 rounded-xl border text-sm"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--fg)' }} />
        </div>
        <button type="submit" className="w-full py-3 rounded-xl text-white font-semibold cursor-pointer"
          style={{ backgroundColor: '#FF6B4A' }}>Save Changes</button>
      </form>
    </div>
  )
}
