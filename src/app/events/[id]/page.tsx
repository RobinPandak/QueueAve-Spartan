import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  open: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
}

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: event } = await supabase
    .from('spartan_events').select('*').eq('id', id).single()
  if (!event) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === event.organizer_id

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/join/${event.id}`

  const tabs = [
    { label: 'Participants', href: `/events/${id}/participants` },
    { label: 'Groups', href: `/events/${id}/groups` },
    { label: 'Sessions', href: `/events/${id}/sessions` },
    { label: 'Progress', href: `/events/${id}/progress` },
  ]

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-extrabold">{event.name}</h1>
            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide ${STATUS_COLORS[event.status]}`}>
              {event.status}
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            {event.venue ? ` · ${event.venue}` : ''}
          </p>
        </div>
        {isOwner && (
          <Link href={`/events/${id}/edit`} className="text-sm font-medium cursor-pointer" style={{ color: 'var(--muted)' }}>Edit</Link>
        )}
      </div>

      {event.status === 'open' && isOwner && (
        <div className="p-4 rounded-2xl border mb-6" style={{ backgroundColor: 'var(--subtle)', borderColor: 'var(--border)' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>Share link</p>
          <p className="text-sm font-mono break-all">{shareUrl}</p>
        </div>
      )}

      <div className="flex gap-1 border-b mb-6" style={{ borderColor: 'var(--border)' }}>
        {tabs.map(tab => (
          <Link
            key={tab.label}
            href={tab.href}
            className="px-4 py-2.5 text-sm font-medium cursor-pointer rounded-t-lg transition-colors"
            style={{ color: 'var(--muted)' }}
          >{tab.label}</Link>
        ))}
      </div>

      <div className="text-center py-12" style={{ color: 'var(--muted)' }}>
        <p className="text-sm">Select a tab above to get started.</p>
      </div>
    </div>
  )
}
