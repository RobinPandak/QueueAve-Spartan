import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  open: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: events } = await supabase
    .from('spartan_events')
    .select('*')
    .eq('organizer_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold" style={{ fontFamily: 'var(--font-bricolage)' }}>
          Your Events
        </h1>
        <Link
          href="/events/new"
          className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md"
          style={{ backgroundColor: '#FF6B4A' }}
        >
          New Event
        </Link>
      </div>

      {!events?.length && (
        <div className="text-center py-20" style={{ color: 'var(--muted)' }}>
          <p className="text-lg font-medium mb-2">No events yet</p>
          <p className="text-sm">Create your first training event to get started.</p>
        </div>
      )}

      <div className="space-y-3">
        {events?.map(event => (
          <Link
            key={event.id}
            href={`/events/${event.id}`}
            className="flex items-center justify-between p-5 rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div>
              <p className="font-bold text-base">{event.name}</p>
              <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
                {new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                {event.venue ? ` · ${event.venue}` : ''}
              </p>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide ${STATUS_STYLES[event.status]}`}>
              {event.status}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
