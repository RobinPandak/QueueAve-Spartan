import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { toggleCheckIn, reassignGroup } from '@/app/actions/participants'
import Link from 'next/link'

export default async function ParticipantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('spartan_events')
    .select('*')
    .eq('id', id)
    .single()
  if (!event) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === event.organizer_id

  const { data: rawParticipants } = await supabase
    .from('spartan_participants')
    .select('id, checked_in, group_id, status, spartan_players(name)')
    .eq('event_id', id)

  const participants = (rawParticipants ?? []).map(p => ({
    id: p.id, checked_in: p.checked_in, group_id: p.group_id, status: p.status,
    name: (p.spartan_players as any)?.name ?? '',
  })).sort((a, b) => a.name.localeCompare(b.name))

  const { data: groups } = await supabase
    .from('spartan_groups')
    .select('*')
    .eq('event_id', id)
    .order('sort_order')

  const checkedIn = participants?.filter(p => p.checked_in).length ?? 0

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href={`/events/${id}`} className="text-sm cursor-pointer" style={{ color: 'var(--muted)' }}>
            Back to {event.name}
          </Link>
          <h2 className="text-2xl font-extrabold mt-2">Participants</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            {checkedIn} of {participants?.length ?? 0} checked in
          </p>
        </div>
      </div>

      {participants && participants.length > 0 ? (
        <div className="space-y-2">
          {participants.map(p => (
            <div
              key={p.id}
              className="flex items-center gap-3 p-4 rounded-xl border"
              style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{p.name}</p>
                {groups && groups.length > 0 && (
                  <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                    {groups.find(g => g.id === p.group_id)?.name ?? 'No group'}
                  </p>
                )}
              </div>

              {isOwner && groups && groups.length > 0 && (
                <form
                  action={async (fd: FormData) => {
                    'use server'
                    const groupId = fd.get('group_id') as string | null
                    await reassignGroup(p.id, id, groupId || null)
                  }}
                  className="flex items-center gap-1"
                >
                  <select
                    name="group_id"
                    defaultValue={p.group_id ?? ''}
                    className="px-2 py-1.5 rounded-lg border text-xs cursor-pointer"
                    style={{
                      backgroundColor: 'var(--subtle)',
                      borderColor: 'var(--border)',
                      color: 'var(--fg)',
                    }}
                  >
                    <option value="">No group</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="px-2 py-1.5 rounded-lg text-xs cursor-pointer font-medium"
                    style={{ backgroundColor: 'var(--subtle)', color: 'var(--muted)' }}
                  >
                    Save
                  </button>
                </form>
              )}

              {isOwner && (
                <form
                  action={async () => {
                    'use server'
                    await toggleCheckIn(p.id, id, !p.checked_in)
                  }}
                >
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    style={{
                      backgroundColor: p.checked_in
                        ? 'rgba(0, 191, 165, 0.1)'
                        : 'var(--subtle)',
                      color: p.checked_in ? '#00BFA5' : 'var(--muted)',
                    }}
                  >
                    {p.checked_in ? 'Checked in' : 'Check in'}
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8" style={{ color: 'var(--muted)' }}>
          <p className="text-sm">
            No participants yet. Share the event link to get registrations.
          </p>
        </div>
      )}
    </div>
  )
}
