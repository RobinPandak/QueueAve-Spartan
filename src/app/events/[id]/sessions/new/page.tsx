import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { createSession } from '@/app/actions/sessions'
import Link from 'next/link'

export default async function NewSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: event } = await supabase.from('spartan_events').select('*').eq('id', id).single()
  if (!event) notFound()
  const { data: templates } = await supabase.from('spartan_session_templates').select('*').eq('event_id', id)
  const { data: groups } = await supabase.from('spartan_groups').select('*').eq('event_id', id).order('sort_order')

  return (
    <div className="max-w-lg">
      <Link href={`/events/${id}/sessions`} className="text-sm cursor-pointer" style={{ color: 'var(--muted)' }}>← Sessions</Link>
      <h2 className="text-2xl font-extrabold mt-2 mb-8">Record Session</h2>

      <form action={async (fd: FormData) => {
        'use server'
        await createSession(id, fd.get('template_id') as string, fd.get('group_id') as string || null, fd.get('session_date') as string, fd.get('notes') as string)
      }} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Template</label>
          <select name="template_id" required
            className="w-full px-4 py-2.5 rounded-xl border text-sm cursor-pointer"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--fg)' }}>
            <option value="">Select a template</option>
            {templates?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Date</label>
          <input type="date" name="session_date" required defaultValue={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-2.5 rounded-xl border text-sm"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--fg)' }} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Group <span style={{ color: 'var(--muted)' }}>(optional)</span></label>
          <select name="group_id"
            className="w-full px-4 py-2.5 rounded-xl border text-sm cursor-pointer"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--fg)' }}>
            <option value="">All groups</option>
            {groups?.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Notes <span style={{ color: 'var(--muted)' }}>(optional)</span></label>
          <textarea name="notes" rows={2}
            className="w-full px-4 py-2.5 rounded-xl border text-sm"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--fg)' }} />
        </div>
        <button type="submit" className="w-full py-3 rounded-xl text-white font-semibold cursor-pointer"
          style={{ backgroundColor: '#FF6B4A' }}>Start Session</button>
      </form>
    </div>
  )
}
