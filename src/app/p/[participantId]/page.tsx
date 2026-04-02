import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ParticipantProfile } from './participant-profile'
import { headers } from 'next/headers'

export default async function ParticipantPage({ params }: { params: Promise<{ participantId: string }> }) {
  const { participantId } = await params
  const supabase = await createClient()

  const { data: participant } = await supabase
    .from('spartan_participants')
    .select('id, name')
    .eq('id', participantId)
    .single()

  if (!participant) notFound()

  const hdrs = await headers()
  const host = hdrs.get('host') ?? 'spartan.queueave.com'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const profileUrl = `${protocol}://${host}/p/${participantId}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(profileUrl)}&bgcolor=ffffff&color=1A1A1A&margin=12`

  return (
    <ParticipantProfile
      participantId={participantId}
      name={participant.name}
      qrUrl={qrUrl}
      profileUrl={profileUrl}
    />
  )
}
