import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Calendar, MapPin, ArrowRight } from 'lucide-react'

function formatDate(d: string | null) {
  if (!d) return null
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default async function ParticipantPage({ params }: { params: Promise<{ participantId: string }> }) {
  const { participantId } = await params
  const supabase = await createClient()

  const { data: participant } = await supabase
    .from('spartan_participants')
    .select('*, spartan_events(id, name, date, venue), spartan_groups(name)')
    .eq('id', participantId)
    .single()

  if (!participant) notFound()

  const event = participant.spartan_events as { id: string; name: string; date: string | null; venue: string | null } | null
  const group = participant.spartan_groups as { name: string } | null

  const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL}/p/${participantId}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(profileUrl)}&bgcolor=ffffff&color=1A1A1A&margin=10`

  const initials = participant.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="w-full max-w-sm space-y-4">

        {/* Branding */}
        <div className="text-center">
          <img src="/logo.svg" alt="QueueAve" width="40" height="40" className="mx-auto mb-3" />
          <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#FF6B4A' }}>Spartan by QueueAve</p>
        </div>

        {/* Confirmation card */}
        <div className="rounded-2xl border p-6 text-center space-y-4" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>

          {/* Avatar */}
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto text-xl font-black"
            style={{ backgroundColor: 'rgba(255,107,74,.12)', color: '#FF6B4A' }}>
            {initials}
          </div>

          {/* Name + status */}
          <div>
            <h1 className="font-display text-xl font-extrabold" style={{ color: 'var(--fg)' }}>{participant.name}</h1>
            <span className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold px-3 py-1 rounded-full"
              style={{ backgroundColor: 'rgba(0,191,165,.12)', color: '#00896E' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00BFA5]" />
              You&apos;re registered!
            </span>
          </div>

          {/* Event details */}
          {event && (
            <div className="rounded-xl p-3.5 text-left space-y-1.5" style={{ backgroundColor: 'var(--subtle)' }}>
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--fg)' }}>{event.name}</p>
              {event.date && (
                <p className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted)' }}>
                  <Calendar className="w-3.5 h-3.5" />{formatDate(event.date)}
                </p>
              )}
              {event.venue && (
                <p className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted)' }}>
                  <MapPin className="w-3.5 h-3.5 text-[#FF6B4A]" />{event.venue}
                </p>
              )}
              {group && (
                <p className="text-xs font-medium mt-1 pt-1.5 border-t" style={{ color: 'var(--muted)', borderColor: 'var(--border)' }}>
                  Group: <span style={{ color: 'var(--fg)' }}>{group.name}</span>
                </p>
              )}
            </div>
          )}

          {/* QR code */}
          <div className="space-y-2">
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Save this QR code for check-in</p>
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrUrl}
                alt="QR code"
                width={140}
                height={140}
                className="rounded-xl"
                style={{ border: '1px solid var(--border)' }}
              />
            </div>
          </div>
        </div>

        {/* Progress link */}
        <Link
          href={`/p/${participantId}/progress`}
          className="flex items-center justify-between w-full px-5 py-4 rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-sm"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>My progress</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>View your training results and trends</p>
          </div>
          <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--muted)' }} />
        </Link>

      </div>
    </div>
  )
}
