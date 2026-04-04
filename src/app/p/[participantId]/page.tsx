import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ParticipantProfile } from './participant-profile'
import { headers } from 'next/headers'

export default async function ParticipantPage({ params }: { params: Promise<{ participantId: string }> }) {
  const { participantId } = await params
  const supabase = await createClient()

  const { data: participant } = await supabase
    .from('spartan_participants')
    .select('id, status, player_id, spartan_players(id, name, avatar_url), spartan_events(name, date, start_time, venue)')
    .eq('id', participantId)
    .single()

  if (!participant) notFound()

  const player = participant.spartan_players as any
  const event = participant.spartan_events as unknown as { name: string; date: string | null; start_time: string | null; venue: string | null } | null

  const hdrs = await headers()
  const host = hdrs.get('host') ?? 'spartan.queueave.com'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  // QR encodes the permanent player URL so it works across all events
  const playerUrl = `${protocol}://${host}/player/${player?.id}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(playerUrl)}&bgcolor=ffffff&color=1A1A1A&margin=12`

  return (
    <ParticipantProfile
      participantId={participantId}
      playerId={player?.id ?? ''}
      name={player?.name ?? ''}
      status={participant.status}
      event={event}
      qrUrl={qrUrl}
      profileUrl={playerUrl}
      avatarUrl={player?.avatar_url ?? null}
    />
  )
}
