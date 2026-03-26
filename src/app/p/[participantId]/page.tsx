import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function ParticipantPage({ params }: { params: Promise<{ participantId: string }> }) {
  const { participantId } = await params
  const supabase = await createClient()
  const { data: participant } = await supabase
    .from('spartan_participants')
    .select('*, spartan_events(*), spartan_groups(*)')
    .eq('id', participantId)
    .single()
  if (!participant) notFound()

  const event = participant.spartan_events as { name: string; date: string; venue: string | null } | null
  const group = participant.spartan_groups as { name: string } | null

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="w-full max-w-sm text-center">
        <img src="/logo.svg" alt="Spartan" width="48" height="48" className="mx-auto mb-4" />
        <div
          className="p-6 rounded-2xl border"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-black"
            style={{ backgroundColor: 'rgba(255,107,74,0.1)', color: '#FF6B4A' }}
          >
            {participant.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-xl font-extrabold mb-1">{participant.name}</h1>
          <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
            {group ? group.name : 'No group'} · {event?.name}
          </p>
          <div
            className="text-xs py-2 px-4 rounded-full inline-block font-semibold"
            style={{ backgroundColor: 'rgba(0,191,165,0.1)', color: '#00BFA5' }}
          >
            Registered
          </div>
          <div className="mt-6">
            <Link
              href={`/p/${participantId}/progress`}
              className="block w-full py-2.5 rounded-xl border text-sm font-medium cursor-pointer"
              style={{ borderColor: 'var(--border)', color: 'var(--fg)' }}
            >
              View my progress
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
