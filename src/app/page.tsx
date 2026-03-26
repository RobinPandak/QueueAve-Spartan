import { createClient } from '@/lib/supabase/server'
import LandingClient from './landing-client'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return <LandingClient user={!!user} />
}
