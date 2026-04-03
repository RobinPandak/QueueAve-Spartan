'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function useRealtimeParticipants(eventId: string) {
  const router = useRouter()
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`spartan-participants-${eventId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'spartan_participants', filter: `event_id=eq.${eventId}` },
        () => { router.refresh() },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [eventId, router])
}
