import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ParticipantProfile } from './participant-profile'
import { headers } from 'next/headers'

export default async function ParticipantPage({ params }: { params: Promise<{ participantId: string }> }) {
  const { participantId } = await params
  const supabase = await createClient()

  const { data: participant } = await supabase
    .from('spartan_participants')
    .select('*, spartan_events(name, date, start_time, venue)')
    .eq('id', participantId)
    .single()

  if (!participant) notFound()

  const hdrs = await headers()
  const host = hdrs.get('host') ?? 'spartan.queueave.com'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const profileUrl = `${protocol}://${host}/p/${participantId}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(profileUrl)}&bgcolor=ffffff&color=1A1A1A&margin=12`

  const event = participant.spartan_events as { name: string; date: string | null; start_time: string | null; venue: string | null } | null

  return (
    <ParticipantProfile
      participantId={participantId}
      name={participant.name}
      status={participant.status}
      event={event}
      qrUrl={qrUrl}
      profileUrl={profileUrl}
    />
  )
}
