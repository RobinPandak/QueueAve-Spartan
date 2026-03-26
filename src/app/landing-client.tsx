'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowRight, TrendingUp, Users, ClipboardList, BarChart2, Menu, X, LogOut } from 'lucide-react'
import { logout } from '@/app/actions/auth'

/* ─── Intersection observer hook ─── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

/* ─── Reveal wrapper ─── */
function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, inView } = useInView(0.1)
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

/* ─── Floating obstacles background ─── */
function FloatingShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {[
        { x: '10%', y: '20%', delay: '0s', size: 28, opacity: 0.06, dur: '18s', rotate: 12 },
        { x: '80%', y: '15%', delay: '3s', size: 22, opacity: 0.05, dur: '22s', rotate: -8 },
        { x: '68%', y: '60%', delay: '1.5s', size: 20, opacity: 0.04, dur: '20s', rotate: 20 },
      ].map((s, i) => (
        <svg
          key={i}
          width={s.size}
          height={s.size}
          viewBox="0 0 24 24"
          fill="none"
          className="absolute"
          style={{
            left: s.x,
            top: s.y,
            opacity: s.opacity,
            transform: `rotate(${s.rotate}deg)`,
            animation: `float ${s.dur} ${s.delay} ease-in-out infinite`,
          }}
        >
          {/* Checkmark / obstacle icon */}
          <path d="M20 6L9 17l-5-5" stroke="#FF6B4A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ))}
    </div>
  )
}

/* ─── Rotating word ─── */
const WORDS = ['tracked', 'measured', 'simplified', 'optimized']

function RotatingWord() {
  const [index, setIndex] = useState(0)
  const [animate, setAnimate] = useState(true)
  useEffect(() => {
    let inner: ReturnType<typeof setTimeout>
    const timer = setInterval(() => {
      setAnimate(false)
      inner = setTimeout(() => {
        setIndex(i => (i + 1) % WORDS.length)
        setAnimate(true)
      }, 200)
    }, 3000)
    return () => { clearInterval(timer); clearTimeout(inner) }
  }, [])
  return (
    <span
      className={`inline-block text-[#FF6B4A] transition-all duration-300 ${
        animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      {WORDS[index]}
    </span>
  )
}

/* ─── How-It-Works phone visual ─── */
function HowItWorksVisual({ activeStep }: { activeStep: number }) {
  return (
    <div className="relative w-full max-w-sm mx-auto aspect-square">
      <div className="absolute inset-4 rounded-[2rem] border-2 overflow-hidden shadow-xl" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
        {/* Status bar */}
        <div className="h-6 flex items-center justify-center" style={{ backgroundColor: 'var(--subtle)' }}>
          <div className="w-16 h-1.5 rounded-full" style={{ backgroundColor: 'var(--border)' }} />
        </div>

        {/* Step 1: Create event */}
        <div className={`absolute inset-0 top-6 p-5 flex flex-col justify-center transition-all duration-500 ${activeStep === 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(255,107,74,0.12)' }}>
            <ClipboardList className="w-7 h-7 text-[#FF6B4A]" />
          </div>
          <div className="space-y-2.5">
            <div className="h-8 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--subtle)' }} />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-8 rounded-lg" style={{ backgroundColor: 'rgba(0,191,165,0.12)' }} />
              <div className="h-8 rounded-lg" style={{ backgroundColor: 'rgba(255,184,0,0.12)' }} />
            </div>
            <div className="h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#FF6B4A' }}>
              <span className="text-white text-xs font-semibold">Create Event</span>
            </div>
          </div>
        </div>

        {/* Step 2: Athletes sign up */}
        <div className={`absolute inset-0 top-6 p-5 flex flex-col items-center justify-center transition-all duration-500 ${activeStep === 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
          <div className="w-24 h-24 rounded-2xl p-2 mb-4" style={{ backgroundColor: 'var(--fg)' }}>
            <div className="w-full h-full rounded-lg grid grid-cols-5 grid-rows-5 gap-0.5 p-1" style={{ backgroundColor: 'var(--bg)' }}>
              {Array.from({ length: 25 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-sm"
                  style={{
                    backgroundColor: [0,1,2,4,5,6,10,12,14,18,20,22,23,24].includes(i)
                      ? 'var(--fg)'
                      : 'transparent'
                  }}
                />
              ))}
            </div>
          </div>
          <div className="flex -space-x-2 mb-2">
            {['rgba(255,107,74,0.15)', 'rgba(0,191,165,0.15)', 'rgba(255,184,0,0.15)', 'rgba(255,107,74,0.15)'].map((bg, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 flex items-center justify-center"
                style={{
                  backgroundColor: bg,
                  borderColor: 'var(--card)',
                  animation: activeStep === 1 ? `pop-in 0.4s ${i * 0.15}s ease-out both` : 'none'
                }}
              >
                <Users className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
              </div>
            ))}
          </div>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>4 athletes joined</p>
        </div>

        {/* Step 3: Track progress */}
        <div className={`absolute inset-0 top-6 p-4 flex flex-col justify-center transition-all duration-500 ${activeStep === 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
          {/* Mini result row */}
          <div className="w-full rounded-xl p-3 mb-3" style={{ backgroundColor: 'var(--subtle)' }}>
            <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted)' }}>Last Session</div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Maria</span>
              <span className="text-xs font-mono font-bold text-[#FF6B4A]">3:42</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs font-medium">Paolo</span>
              <span className="text-xs font-mono font-bold">4:05</span>
            </div>
          </div>
          {/* Trend badge */}
          <div className="w-full rounded-xl p-3" style={{ backgroundColor: 'rgba(0,191,165,0.1)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#00BFA5]" />
                <span className="text-xs font-medium text-[#00BFA5]">Maria improving</span>
              </div>
              <span className="text-xs font-bold text-[#00BFA5]">-23s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════ */
/*              LANDING PAGE                  */
/* ═══════════════════════════════════════════ */

export default function LandingClient({ user }: { user: boolean }) {
  const [activeStep, setActiveStep] = useState(0)
  const [navSolid, setNavSolid] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const ctaHref = user ? '/dashboard' : '/login'

  const startStepTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => setActiveStep(s => (s + 1) % 3), 4000)
  }, [])

  useEffect(() => {
    startStepTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [startStepTimer])

  useEffect(() => {
    const handler = () => setNavSolid(window.scrollY > 50)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const steps = [
    { num: '01', title: 'Create your event', desc: 'Set up groups, define training templates. Ready in minutes.', color: '#FF6B4A' },
    { num: '02', title: 'Athletes sign up', desc: 'Share a join link. No app, no accounts required.', color: '#00BFA5' },
    { num: '03', title: 'Record and improve', desc: 'Log session results. Charts show who is trending up.', color: '#FFB800' },
  ]

  const features = [
    {
      icon: <Users className="w-6 h-6" />,
      color: '#FF6B4A',
      title: 'Training groups',
      desc: 'Organize athletes by level or time slot. Assign individual start times per group.',
    },
    {
      icon: <ClipboardList className="w-6 h-6" />,
      color: '#00BFA5',
      title: 'Session templates',
      desc: 'Define your metrics once (time, count, pass/fail). Reuse across every session.',
    },
    {
      icon: <BarChart2 className="w-6 h-6" />,
      color: '#FFB800',
      title: 'Progress charts',
      desc: 'Automatic trend detection. Line charts per metric, per athlete. Shareable leaderboard.',
    },
  ]

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: 'var(--bg)' }}>

      {/* ─── Nav ─── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={navSolid ? { backgroundColor: 'rgba(255,248,245,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' } : {}}
      >
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="Spartan" width="32" height="32" />
            <span className="font-display font-extrabold text-lg" style={{ color: 'var(--fg)' }}>Spartan</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--subtle)', color: 'var(--muted)' }}>by QueueAve</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <Link href="/dashboard" className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: '#FF6B4A' }}>
                  Dashboard
                </Link>
                <form action={logout}>
                  <button type="submit" className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium cursor-pointer transition-colors hover:opacity-80" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
                    <LogOut className="w-3.5 h-3.5" />
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 text-sm font-medium transition-colors hover:opacity-70" style={{ color: 'var(--muted)' }}>Sign in</Link>
                <Link href={ctaHref} className="group px-5 py-2.5 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-2 transition-all hover:opacity-90 active:scale-[0.97]" style={{ backgroundColor: '#FF6B4A' }}>
                  Get Started
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl transition-colors"
            style={{ color: 'var(--fg)' }}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b px-6 pb-5 pt-2 space-y-1" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
            {user ? (
              <>
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-white text-center" style={{ backgroundColor: '#FF6B4A' }}>Dashboard</Link>
                <form action={logout}>
                  <button type="submit" className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm cursor-pointer" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
                    <LogOut className="w-3.5 h-3.5" /> Sign out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors" style={{ color: 'var(--muted)' }}>Sign in</Link>
                <Link href={ctaHref} onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-white text-center" style={{ backgroundColor: '#FF6B4A' }}>Get Started</Link>
              </>
            )}
          </div>
        )}
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-6 pt-20">
        <FloatingShapes />

        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'rgba(255,107,74,0.05)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'rgba(0,191,165,0.05)', filter: 'blur(80px)' }} />

        <div className="relative max-w-3xl mx-auto text-center">
          <h1
            className="animate-fade-in-up font-display text-5xl sm:text-7xl lg:text-[5.5rem] font-extrabold tracking-tight leading-[1.02]"
            style={{ animationDelay: '100ms', color: 'var(--fg)' }}
          >
            Obstacle training,
            <br />
            <RotatingWord />
          </h1>

          <p
            className="animate-fade-in-up mt-6 text-lg sm:text-xl max-w-lg mx-auto leading-relaxed"
            style={{ animationDelay: '200ms', color: 'var(--muted)' }}
          >
            Create an event. Register your athletes. Track every rep, every second, every session.
          </p>

          <div className="animate-fade-in-up mt-10 flex flex-col sm:flex-row items-center justify-center gap-4" style={{ animationDelay: '300ms' }}>
            <Link
              href={ctaHref}
              className="group relative px-8 py-4 rounded-2xl font-semibold text-base text-white inline-flex items-center gap-2.5 transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
              style={{ backgroundColor: '#FF6B4A', boxShadow: '0 8px 32px rgba(255,107,74,0.25)' }}
            >
              Start for free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#how-it-works"
              className="px-6 py-4 text-sm font-medium inline-flex items-center gap-2 transition-colors hover:opacity-70"
              style={{ color: 'var(--muted)' }}
            >
              See how it works
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="animate-bounce">
                <path d="M8 3v10m0 0l-3-3m3 3l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="py-24 sm:py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: '#FF6B4A' }}>How it works</p>
              <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight" style={{ color: 'var(--fg)' }}>
                Three steps to race day
              </h2>
              <p className="mt-3 max-w-md mx-auto" style={{ color: 'var(--muted)' }}>
                From setup to session records in minutes. No app downloads for your athletes.
              </p>
            </div>
          </Reveal>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Steps */}
            <div className="space-y-6">
              {steps.map((step, i) => (
                <Reveal key={step.num} delay={i * 100}>
                  <button
                    onClick={() => { setActiveStep(i); startStepTimer() }}
                    className="w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer"
                    style={activeStep === i
                      ? { borderColor: step.color, backgroundColor: 'var(--card)' }
                      : { borderColor: 'transparent' }
                    }
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300"
                        style={{
                          backgroundColor: activeStep === i ? `${step.color}20` : 'transparent',
                          color: activeStep === i ? step.color : 'var(--muted)',
                        }}
                      >
                        <span className="font-mono text-sm font-bold">{step.num}</span>
                      </div>
                      <div className="flex-1">
                        <h3
                          className="font-display font-bold transition-colors duration-300"
                          style={{ color: activeStep === i ? 'var(--fg)' : 'var(--muted)' }}
                        >
                          {step.title}
                        </h3>
                        <p
                          className="text-sm mt-1 transition-colors duration-300"
                          style={{ color: activeStep === i ? 'var(--muted)' : 'rgba(107,107,107,0.5)' }}
                        >
                          {step.desc}
                        </p>
                        {activeStep === i && (
                          <div className="mt-3 h-0.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
                            <div
                              className="h-full rounded-full"
                              style={{ backgroundColor: step.color, animation: 'shrinkWidth 4s linear reverse' }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                </Reveal>
              ))}
            </div>

            {/* Visual */}
            <Reveal delay={200}>
              <HowItWorksVisual activeStep={activeStep} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="py-24 sm:py-32 px-6" style={{ backgroundColor: 'var(--subtle)' }}>
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-14">
              <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: '#FF6B4A' }}>Features</p>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: 'var(--fg)' }}>
                Built for coaches who take data seriously
              </h2>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 100}>
                <div className="p-6 rounded-2xl border h-full" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${f.color}18`, color: f.color }}
                  >
                    {f.icon}
                  </div>
                  <h3 className="font-display font-bold mb-2" style={{ color: 'var(--fg)' }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonial ─── */}
      <section className="py-24 sm:py-32 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <Reveal>
            <div className="relative">
              <svg className="absolute -top-4 -left-2 w-12 h-12" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'rgba(255,107,74,0.1)' }}>
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
              <blockquote className="font-display text-2xl sm:text-3xl font-bold leading-snug" style={{ color: 'var(--fg)' }}>
                Our athletes can finally see how they are improving between sessions. It changed how we coach.
              </blockquote>
              <div className="mt-6 flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,107,74,0.12)' }}>
                  <span className="text-sm font-bold" style={{ color: '#FF6B4A' }}>CJ</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>Coach Jana</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>OCR Training Manila</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 sm:py-32 px-6" style={{ backgroundColor: 'var(--subtle)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <Reveal>
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight mb-4" style={{ color: 'var(--fg)' }}>
              Ready to track your training?
            </h2>
            <p className="text-lg mb-10" style={{ color: 'var(--muted)' }}>
              Free to start. No credit card required.
            </p>
            <Link
              href={ctaHref}
              className="group inline-flex items-center gap-2.5 px-10 py-4 rounded-2xl font-semibold text-base text-white transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
              style={{ backgroundColor: '#FF6B4A', boxShadow: '0 8px 32px rgba(255,107,74,0.25)' }}
            >
              {user ? 'Go to Dashboard' : 'Start for free'}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-10 px-6 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Spartan" width="24" height="24" />
            <span className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>Spartan</span>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>by QueueAve</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Training session management for obstacle course coaches.
          </p>
        </div>
      </footer>

    </div>
  )
}
