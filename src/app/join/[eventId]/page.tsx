import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Calendar, MapPin } from 'lucide-react'
import { JoinForm } from './join-form'

function formatDate(d: string | null) {
  if (!d) return null
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export default async function JoinPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const supabase = await createClient()

  const [{ data: event }, { data: groups }] = await Promise.all([
    supabase.from('spartan_events').select('id, name, date, venue, description, status, social_platform').eq('id', eventId).single(),
    supabase.from('spartan_groups').select('id, name, start_time').eq('event_id', eventId).order('sort_order'),
  ])

  if (!event || event.status !== 'open') notFound()

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="w-full max-w-sm space-y-5">

        {/* Branding */}
        <div className="text-center">
          <img src="/logo.svg" alt="QueueAve" width="40" height="40" className="mx-auto mb-3" />
          <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#FF6B4A' }}>Spartan by QueueAve</p>
        </div>

        {/* Event info card */}
        <div className="rounded-2xl border p-5 space-y-3" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
          <div>
            <h1 className="font-display text-xl font-extrabold leading-snug" style={{ color: 'var(--fg)' }}>{event.name}</h1>
            <span className="inline-flex items-center gap-1 mt-1 text-xs font-medium px-2.5 py-0.5 rounded-full"
              style={{ backgroundColor: 'rgba(0,191,165,.12)', color: '#00896E' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00BFA5] animate-pulse" />
              Open for registration
            </span>
          </div>
          <div className="space-y-1.5">
            {event.date && (
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted)' }}>
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                {formatDate(event.date)}
              </div>
            )}
            {event.venue && (
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted)' }}>
                <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-[#FF6B4A]" />
                {event.venue}
              </div>
            )}
          </div>
          {event.description && (
            <p className="text-sm pt-1 border-t" style={{ color: 'var(--muted)', borderColor: 'var(--border)' }}>
              {event.description}
            </p>
          )}
        </div>

        {/* Registration form card */}
        <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
          <h2 className="font-display font-bold text-lg mb-5" style={{ color: 'var(--fg)' }}>Register</h2>
          <JoinForm eventId={eventId} groups={groups ?? []} defaultPlatform={event.social_platform ?? 'instagram'} />
        </div>

      </div>
    </div>
  )
}
