import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import Link from 'next/link'

export default async function EventsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <nav className="sticky top-0 z-10 border-b" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
            <img src="/logo.svg" alt="Spartan" width="32" height="32" />
            <span className="font-extrabold text-lg" style={{ fontFamily: 'var(--font-bricolage)' }}>Spartan</span>
          </Link>
          <form action={logout}>
            <button type="submit" className="text-sm cursor-pointer" style={{ color: 'var(--muted)' }}>Sign out</button>
          </form>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
