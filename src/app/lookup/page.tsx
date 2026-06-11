import { PublicNav } from '@/components/public-nav'
import { SiteFooter } from '@/components/site-footer'
import { LookupClient } from './lookup-client'

export const metadata = {
  title: 'Player Lookup | Spartan by QueueAve',
  description: 'Find an athlete profile by scanning a QR code or entering a player code',
}

export default function LookupPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg)' }}>
      <PublicNav />
      <main className="flex-1 max-w-3xl w-full mx-auto px-5 py-10">
        <h1 className="font-display font-bold text-2xl mb-8" style={{ color: 'var(--fg)' }}>Player Lookup</h1>
        <LookupClient />
      </main>
      <SiteFooter />
    </div>
  )
}
