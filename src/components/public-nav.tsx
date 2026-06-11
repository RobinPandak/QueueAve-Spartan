import Link from 'next/link'

export function PublicNav() {
  return (
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
  )
}
