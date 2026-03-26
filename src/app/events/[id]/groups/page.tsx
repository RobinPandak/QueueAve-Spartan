import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { createGroup, updateGroup, deleteGroup } from '@/app/actions/groups'
import Link from 'next/link'

export default async function GroupsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: event } = await supabase.from('spartan_events').select('*').eq('id', id).single()
  if (!event) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === event.organizer_id

  const { data: groups } = await supabase
    .from('spartan_groups')
    .select('*')
    .eq('event_id', id)
    .order('sort_order')

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href={`/events/${id}`} className="text-sm cursor-pointer" style={{ color: 'var(--muted)' }}>
            Back to {event.name}
          </Link>
          <h2 className="text-2xl font-extrabold mt-2">Groups</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Organize participants into groups with optional start times.
          </p>
        </div>
      </div>

      {groups && groups.length > 0 && (
        <div className="space-y-3 mb-8">
          {groups.map(group => (
            <div key={group.id} className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
              {isOwner ? (
                <form
                  action={async (fd: FormData) => {
                    'use server'
                    await updateGroup(group.id, id, fd.get('name') as string, fd.get('start_time') as string)
                  }}
                  className="flex gap-3 items-end"
                >
                  <div className="flex-1">
                    <label className="text-xs font-semibold uppercase tracking-widest mb-1 block" style={{ color: 'var(--muted)' }}>
                      Group name
                    </label>
                    <input
                      name="name"
                      defaultValue={group.name}
                      className="w-full px-3 py-2 rounded-lg border text-sm"
                      style={{ backgroundColor: 'var(--subtle)', borderColor: 'var(--border)', color: 'var(--fg)' }}
                    />
                  </div>
                  <div className="w-32">
                    <label className="text-xs font-semibold uppercase tracking-widest mb-1 block" style={{ color: 'var(--muted)' }}>
                      Start time
                    </label>
                    <input
                      type="time"
                      name="start_time"
                      defaultValue={group.start_time ?? ''}
                      className="w-full px-3 py-2 rounded-lg border text-sm"
                      style={{ backgroundColor: 'var(--subtle)', borderColor: 'var(--border)', color: 'var(--fg)' }}
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer text-white"
                    style={{ backgroundColor: '#FF6B4A' }}
                  >
                    Save
                  </button>
                </form>
              ) : (
                <div>
                  <h3 className="font-semibold text-base">{group.name}</h3>
                  {group.start_time && (
                    <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                      Starts at {group.start_time}
                    </p>
                  )}
                </div>
              )}
              {isOwner && (
                <form action={async () => { 'use server'; await deleteGroup(group.id, id) }} className="mt-1 flex justify-end">
                  <button type="submit" className="text-xs cursor-pointer" style={{ color: 'var(--muted)' }}>Remove</button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}

      {isOwner && (
        <form
          action={async (fd: FormData) => {
            'use server'
            await createGroup(id, fd.get('name') as string, fd.get('start_time') as string)
          }}
          className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--subtle)', borderColor: 'var(--border)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--muted)' }}>
            Add new group
          </p>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-xs font-semibold uppercase tracking-widest mb-1 block" style={{ color: 'var(--muted)' }}>
                Group name
              </label>
              <input
                name="name"
                placeholder="e.g. Group A, Morning Session"
                required
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--fg)' }}
              />
            </div>
            <div className="w-32">
              <label className="text-xs font-semibold uppercase tracking-widest mb-1 block" style={{ color: 'var(--muted)' }}>
                Start time
              </label>
              <input
                type="time"
                name="start_time"
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--fg)' }}
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer text-white"
              style={{ backgroundColor: '#FF6B4A' }}
            >
              Add Group
            </button>
          </div>
        </form>
      )}

      {!isOwner && (!groups || groups.length === 0) && (
        <div className="text-center py-8" style={{ color: 'var(--muted)' }}>
          <p className="text-sm">No groups created yet.</p>
        </div>
      )}
    </div>
  )
}
