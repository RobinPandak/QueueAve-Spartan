import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { registerParticipant } from '@/app/actions/participants'

export default async function JoinPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const supabase = await createClient()
  const { data: event } = await supabase
    .from('spartan_events')
    .select('*')
    .eq('id', eventId)
    .single()
  if (!event || event.status !== 'open') notFound()

  const { data: groups } = await supabase
    .from('spartan_groups')
    .select('*')
    .eq('event_id', eventId)
    .order('sort_order')

  async function handleRegister(formData: FormData) {
    'use server'
    await registerParticipant(
      eventId,
      formData.get('name') as string,
      (formData.get('group_id') as string) || null,
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo.svg" alt="Spartan" width="48" height="48" className="mx-auto mb-3" />
          <h1 className="text-2xl font-extrabold">{event.name}</h1>
          {event.venue && (
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
              {event.venue}
            </p>
          )}
        </div>

        <div className="p-6 rounded-2xl border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
          <h2 className="font-bold text-lg mb-5">Register</h2>
          <form action={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Your name</label>
              <input
                name="name"
                required
                placeholder="Full name"
                className="w-full px-4 py-2.5 rounded-xl border text-sm"
                style={{ backgroundColor: 'var(--subtle)', borderColor: 'var(--border)', color: 'var(--fg)' }}
              />
            </div>
            {groups && groups.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-1.5">Group</label>
                <select
                  name="group_id"
                  className="w-full px-4 py-2.5 rounded-xl border text-sm cursor-pointer"
                  style={{ backgroundColor: 'var(--subtle)', borderColor: 'var(--border)', color: 'var(--fg)' }}
                >
                  <option value="">No group</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                      {g.start_time ? ` (${g.start_time})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              type="submit"
              className="w-full py-3 rounded-xl text-white font-semibold cursor-pointer"
              style={{ backgroundColor: '#FF6B4A' }}
            >
              Join
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
