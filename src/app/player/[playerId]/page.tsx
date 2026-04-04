import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { PlayerProfile } from './player-profile'

export default async function PlayerPage({ params }: { params: Promise<{ playerId: string }> }) {
  const { playerId } = await params
  const supabase = await createClient()

  const { data: player } = await supabase
    .from('spartan_players')
    .select('*')
    .eq('id', playerId)
    .single()

  if (!player) notFound()

  const { data: enrollments } = await supabase
    .from('spartan_participants')
    .select('id, status, checked_in, spartan_events(id, name, date, start_time, status, venue)')
    .eq('player_id', playerId)
    .order('registered_at', { ascending: false })

  const hdrs = await headers()
  const host = hdrs.get('host') ?? 'spartan.queueave.com'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const playerUrl = `${protocol}://${host}/player/${playerId}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(playerUrl)}&bgcolor=ffffff&color=1A1A1A&margin=12`

  return (
    <PlayerProfile
      playerId={playerId}
      name={player.name}
      avatarUrl={player.avatar_url ?? null}
      enrollments={(enrollments ?? []).map(e => {
        const event = e.spartan_events as any
        return { participantId: e.id, status: e.status, checkedIn: e.checked_in, event: event ? { ...event, start_time: event.start_time ?? null } : null }
      })}
      qrUrl={qrUrl}
      playerUrl={playerUrl}
    />
  )
}
