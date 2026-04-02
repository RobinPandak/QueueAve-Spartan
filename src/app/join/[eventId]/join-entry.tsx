'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, MapPin, QrCode, Mail, ArrowLeft } from 'lucide-react'
import { registerParticipant, findParticipantByEmail } from '@/app/actions/participants'

type View = 'entry' | 'form' | 'qr' | 'email'
type Platform = 'instagram' | 'facebook' | 'x' | 'tiktok'

type EventData = {
  id: string
  name: string
  date: string | null
  start_time: string | null
  venue: string | null
  description: string | null
  social_platform: string | null
}

type Group = { id: string; name: string; start_time: string | null }

type Props = {
  event: EventData
  groups: Group[]
}

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'x',        label: 'X' },
  { value: 'tiktok',   label: 'TikTok' },
]

function formatDate(d: string | null) {
  if (!d) return null
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function EventInfoCard({ event }: { event: EventData }) {
  return (
    <div className="rounded-2xl p-4 space-y-2" style={{ backgroundColor: '#F5F0EB' }}>
      {event.date && (
        <div className="flex items-center gap-2.5 text-sm" style={{ color: '#6B6B6B' }}>
          <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: '#FF6B4A' }} />
          {formatDate(event.date)}
        </div>
      )}
      {event.start_time && (
        <div className="flex items-center gap-2.5 text-sm" style={{ color: '#6B6B6B' }}>
          <Clock className="w-4 h-4 flex-shrink-0" style={{ color: '#FF6B4A' }} />
          {new Date('1970-01-01T' + event.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </div>
      )}
      {event.venue && (
        <div className="flex items-center gap-2.5 text-sm" style={{ color: '#6B6B6B' }}>
          <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: '#FF6B4A' }} />
          {event.venue}
        </div>
      )}
      {event.description && (
        <p className="text-sm pt-1 mt-1 border-t" style={{ color: '#6B6B6B', borderColor: 'rgba(0,0,0,.08)' }}>
          {event.description}
        </p>
      )}
    </div>
  )
}

export function JoinEntry({ event, groups }: Props) {
  const router = useRouter()
  const [view, setView] = useState<View>('entry')

  // Form state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [platform, setPlatform] = useState<Platform>(
    (PLATFORMS.find(p => p.value === (event.social_platform ?? 'instagram'))?.value) ?? 'instagram'
  )

  // Email lookup state
  const [emailQuery, setEmailQuery] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const rawHandle = (fd.get('social_handle') as string).trim()
    const socialHandle = rawHandle
      ? `${platform}:${rawHandle.startsWith('@') ? rawHandle : '@' + rawHandle}`
      : null
    const result = await registerParticipant(
      event.id,
      (fd.get('name') as string).trim(),
      (fd.get('group_id') as string) || null,
      (fd.get('email') as string).trim() || null,
      (fd.get('phone') as string).trim() || null,
      socialHandle,
    )
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  async function handleEmailLookup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEmailError(null)
    setEmailLoading(true)
    const result = await findParticipantByEmail(event.id, emailQuery)
    if ('error' in result) {
      setEmailError(result.error)
      setEmailLoading(false)
    } else {
      router.push(`/p/${result.id}`)
    }
  }

  const inputCls = 'w-full px-4 py-3.5 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/30 transition-all'
  const inputSty = { backgroundColor: '#F5F0EB', border: 'none', color: '#1A1A1A' } as const

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10" style={{ backgroundColor: '#FDF8F5' }}>
      <div className="w-full max-w-sm">

        {/* Card */}
        <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 4px 32px rgba(0,0,0,.08)' }}>

          {/* Coral top bar */}
          <div className="h-1.5 w-full" style={{ backgroundColor: '#FF6B4A' }} />

          <div className="p-6 space-y-5">

            {/* Event title */}
            <h1 className="text-2xl font-black leading-tight text-center" style={{ color: '#1A1A1A', fontFamily: 'var(--font-display, inherit)' }}>
              {event.name}
            </h1>

            {/* Event info */}
            <EventInfoCard event={event} />

            {/* ── Entry view ── */}
            {view === 'entry' && (
              <div className="space-y-3">
                {/* Scan QR */}
                <button
                  type="button"
                  onClick={() => setView('qr')}
                  className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all hover:opacity-90 active:scale-[0.98] cursor-pointer"
                  style={{ backgroundColor: '#FF6B4A' }}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255,255,255,.2)' }}>
                    <QrCode className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">Scan QR Code</p>
                    <p className="text-xs text-white/80">Instant check-in with your player QR</p>
                  </div>
                </button>

                {/* Use Email */}
                <button
                  type="button"
                  onClick={() => setView('email')}
                  className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all hover:opacity-90 active:scale-[0.98] cursor-pointer"
                  style={{ backgroundColor: '#F5F0EB' }}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#E8E0D8' }}>
                    <Mail className="w-5 h-5" style={{ color: '#6B6B6B' }} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold" style={{ color: '#1A1A1A' }}>Use Email</p>
                    <p className="text-xs" style={{ color: '#6B6B6B' }}>Rejoin with your registered email</p>
                  </div>
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(0,0,0,.08)' }} />
                  <span className="text-xs" style={{ color: '#A0A0A0' }}>new here?</span>
                  <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(0,0,0,.08)' }} />
                </div>

                {/* Create profile */}
                <button
                  type="button"
                  onClick={() => setView('form')}
                  className="w-full text-center text-sm font-semibold py-1 cursor-pointer hover:opacity-75 transition-opacity"
                  style={{ color: '#FF6B4A' }}
                >
                  Create your player profile
                </button>
              </div>
            )}

            {/* ── QR view ── */}
            {view === 'qr' && (
              <div className="space-y-4">
                <button type="button" onClick={() => setView('entry')} className="flex items-center gap-1.5 text-sm cursor-pointer hover:opacity-75 transition-opacity" style={{ color: '#6B6B6B' }}>
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div className="rounded-2xl p-5 text-center space-y-3" style={{ backgroundColor: '#F5F0EB' }}>
                  <QrCode className="w-10 h-10 mx-auto" style={{ color: '#FF6B4A' }} />
                  <p className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>Show your QR code</p>
                  <p className="text-xs leading-relaxed" style={{ color: '#6B6B6B' }}>
                    Open your registration confirmation link and show the QR code to the coach for instant check-in.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setView('email')}
                  className="w-full text-center text-sm cursor-pointer hover:opacity-75 transition-opacity"
                  style={{ color: '#FF6B4A' }}
                >
                  Find profile by email instead
                </button>
              </div>
            )}

            {/* ── Email lookup view ── */}
            {view === 'email' && (
              <form onSubmit={handleEmailLookup} className="space-y-3">
                <button type="button" onClick={() => setView('entry')} className="flex items-center gap-1.5 text-sm cursor-pointer hover:opacity-75 transition-opacity" style={{ color: '#6B6B6B' }}>
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <p className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>Find your profile</p>
                <input
                  type="email"
                  required
                  placeholder="Your registered email"
                  className={inputCls}
                  style={inputSty}
                  value={emailQuery}
                  onChange={e => { setEmailQuery(e.target.value); setEmailError(null) }}
                />
                {emailError && (
                  <p className="text-xs px-4 py-2.5 rounded-xl" style={{ backgroundColor: 'rgba(229,72,77,.1)', color: '#E5484D' }}>
                    {emailError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={emailLoading}
                  className="w-full py-3.5 rounded-full font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#FF6B4A' }}
                >
                  {emailLoading
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Looking up...</>
                    : 'Find my profile'}
                </button>
              </form>
            )}

            {/* ── Registration form view ── */}
            {view === 'form' && (
              <form onSubmit={handleRegister} className="space-y-3">
                <button type="button" onClick={() => { setView('entry'); setError(null) }} className="flex items-center gap-1.5 text-sm cursor-pointer hover:opacity-75 transition-opacity" style={{ color: '#6B6B6B' }}>
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>

                <input name="name" required placeholder="Your name" className={inputCls} style={inputSty} autoFocus />
                <input name="email" type="email" required placeholder="Email" className={inputCls} style={inputSty} />
                <input name="phone" type="tel" placeholder="Phone (optional)" className={inputCls} style={inputSty} />

                {/* Social handle */}
                <div className="space-y-2">
                  <div className="flex gap-1.5 flex-wrap">
                    {PLATFORMS.map(p => {
                      const active = platform === p.value
                      return (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setPlatform(p.value)}
                          className="px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer"
                          style={{
                            backgroundColor: active ? 'rgba(255,107,74,.12)' : '#F5F0EB',
                            color: active ? '#FF6B4A' : '#6B6B6B',
                            fontWeight: active ? 600 : 400,
                            border: active ? '1px solid rgba(255,107,74,.3)' : '1px solid transparent',
                          }}
                        >
                          {p.label}
                        </button>
                      )
                    })}
                  </div>
                  <input
                    name="social_handle"
                    placeholder={`@yourhandle (optional)`}
                    className={inputCls}
                    style={inputSty}
                  />
                </div>

                {/* Group */}
                {groups.length > 0 && (
                  <select
                    name="group_id"
                    className={`${inputCls} cursor-pointer`}
                    style={inputSty}
                  >
                    <option value="">No group</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.name}{g.start_time ? ` · ${g.start_time}` : ''}
                      </option>
                    ))}
                  </select>
                )}

                {error && (
                  <p className="text-xs px-4 py-2.5 rounded-xl" style={{ backgroundColor: 'rgba(229,72,77,.1)', color: '#E5484D' }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-full font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#FF6B4A', boxShadow: '0 4px 14px rgba(255,107,74,.25)' }}
                >
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Registering...</>
                    : 'Join Event'}
                </button>
              </form>
            )}

          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-5" style={{ color: '#A0A0A0' }}>
          Powered by <span className="font-semibold" style={{ color: '#FF6B4A' }}>QueueAve</span>
        </p>

      </div>
    </div>
  )
}
