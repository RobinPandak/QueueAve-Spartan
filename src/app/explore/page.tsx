import Link from 'next/link'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { SiteFooter } from '@/components/site-footer'
import { ExploreClient } from './explore-client'

export const metadata = {
  title: 'Explore Trainings | Spartan by QueueAve',
  description: 'Browse open Spartan training events and join one near you',
}

export const revalidate = 60

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  )
}

export default async function ExplorePage() {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date())

  const { data: events } = await serviceClient()
    .from('spartan_events')
    .select('id, name, date, start_time, venue, description, spartan_participants(count)')
    .eq('status', 'open')
    .gte('date', today)
    .order('date', { ascending: true })

  const list = (events ?? []).map(e => ({
    id: e.id as string,
    name: e.name as string,
    date: e.date as string,
    start_time: e.start_time as string | null,
    venue: e.venue as string | null,
    description: e.description as string | null,
    athletes: (e.spartan_participants as unknown as { count: number }[])?.[0]?.count ?? 0,
  }))

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg)' }}>
      <nav className="border-b" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: 40, height: 24 }} aria-label="QueueAve">
              <img src="/brand/qa-icon-v5-trimmed.png" alt="" width="40" height="24" className="block h-full w-full object-contain dark:hidden" draggable={false} />
              <img src="/brand/qa-icon-dark-v5-trimmed.png" alt="" width="40" height="24" className="hidden h-full w-full object-contain dark:block" draggable={false} />
            </span>
            <span className="font-display text-xl font-extrabold tracking-tight leading-none">
              <span style={{ color: 'var(--fg)' }}>Queue</span><span style={{ color: '#FF8559' }}>Ave</span>
            </span>
          </Link>
          <Link href="/login" className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--muted)' }}>
            Sign in
          </Link>
        </div>
      </nav>

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: 'var(--fg)' }}>
            Find your next training
          </h1>
          <p className="mt-2 text-lg" style={{ color: 'var(--muted)' }}>
            Browse open Spartan training events near you
          </p>
        </div>
        <ExploreClient events={list} today={today} />
      </main>

      <SiteFooter />
    </div>
  )
}
