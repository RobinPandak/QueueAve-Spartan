'use client'

export function SiteFooter() {
  return (
    <footer className="border-t" style={{ borderColor: 'var(--border)' }}>
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col items-start gap-4 sm:grid sm:grid-cols-3 sm:items-center">
          <div className="space-y-1.5">
            <p className="text-xs opacity-60" style={{ color: 'var(--muted)' }}>© 2026 QueueAve Information Technology Services</p>
            <div className="flex items-center gap-4 text-xs opacity-60" style={{ color: 'var(--muted)' }}>
              <a href="/privacy" className="transition-opacity hover:opacity-80">Privacy</a>
              <a href="/terms" className="transition-opacity hover:opacity-80">Terms</a>
            </div>
          </div>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-1.5 text-sm font-medium cursor-pointer transition-opacity hover:opacity-70 sm:justify-self-center"
            style={{ color: 'var(--muted)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 256 256" className="w-4 h-4">
              <path d="M205.66,117.66a8,8,0,0,1-11.32,0L136,59.31V216a8,8,0,0,1-16,0V59.31L61.66,117.66a8,8,0,0,1-11.32-11.32l72-72a8,8,0,0,1,11.32,0l72,72A8,8,0,0,1,205.66,117.66Z" />
            </svg>
            Back to top
          </button>
          <div className="flex items-center gap-4 sm:justify-self-end">
            <a
              href="https://www.facebook.com/queueaveofficial"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="QueueAve on Facebook"
              className="transition-opacity hover:opacity-70"
              style={{ color: 'var(--muted)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 256 256" className="w-5 h-5">
                <path d="M232,128a104.16,104.16,0,0,1-91.55,103.26,4,4,0,0,1-4.45-4V152h24a8,8,0,0,0,8-8.53,8.17,8.17,0,0,0-8.25-7.47H136V112a16,16,0,0,1,16-16h16a8,8,0,0,0,8-8.53A8.17,8.17,0,0,0,167.73,80H152a32,32,0,0,0-32,32v24H96a8,8,0,0,0-8,8.53A8.17,8.17,0,0,0,96.27,152H120v75.28a4,4,0,0,1-4.44,4A104.15,104.15,0,0,1,24.07,124.09c2-54,45.74-97.9,99.78-100A104.12,104.12,0,0,1,232,128Z" />
              </svg>
            </a>
            <a
              href="https://www.instagram.com/queueaveofficial/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="QueueAve on Instagram"
              className="transition-opacity hover:opacity-70"
              style={{ color: 'var(--muted)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 256 256" className="w-5 h-5">
                <path d="M176,24H80A56.06,56.06,0,0,0,24,80v96a56.06,56.06,0,0,0,56,56h96a56.06,56.06,0,0,0,56-56V80A56.06,56.06,0,0,0,176,24ZM128,176a48,48,0,1,1,48-48A48.05,48.05,0,0,1,128,176Zm60-96a12,12,0,1,1,12-12A12,12,0,0,1,188,80Zm-28,48a32,32,0,1,1-32-32A32,32,0,0,1,160,128Z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
