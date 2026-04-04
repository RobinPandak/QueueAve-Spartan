'use client'

import { useRef, useState } from 'react'
import { Camera, Download, Calendar, MapPin, Check, Smartphone } from 'lucide-react'
import { uploadAvatar } from '@/app/actions/participants'
import Link from 'next/link'

type Enrollment = {
  participantId: string
  status: string | null
  checkedIn: boolean
  event: { id: string; name: string; date: string | null; status: string; venue: string | null } | null
}

type Props = {
  playerId: string
  name: string
  avatarUrl: string | null
  enrollments: Enrollment[]
  qrUrl: string
  playerUrl: string
}

function formatDate(d: string | null) {
  if (!d) return null
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

const EVENT_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  draft:       { label: 'Draft',       color: 'var(--muted)',  bg: 'var(--subtle)' },
  open:        { label: 'Open',        color: '#00896E',       bg: 'rgba(0,191,165,.12)' },
  in_progress: { label: 'In Progress', color: '#C44A2A',       bg: 'rgba(255,107,74,.12)' },
  completed:   { label: 'Completed',   color: 'var(--muted)',  bg: 'var(--subtle)' },
}

export function PlayerProfile({ playerId, name, avatarUrl: initialAvatarUrl, enrollments, qrUrl, playerUrl }: Props) {
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarError(null)
    setAvatarLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const result = await uploadAvatar(playerId, fd)
      if ('error' in result) throw new Error(result.error)
      setAvatarUrl(result.url)
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Failed to upload photo.')
    } finally {
      setAvatarLoading(false)
      if (photoInputRef.current) photoInputRef.current.value = ''
    }
  }

  async function saveQr() {
    setSaving(true)
    try {
      const canvas = document.createElement('canvas')
      const W = 480, QR_SIZE = 280, LOGO_SIZE = 48
      canvas.width = W
      canvas.height = 460
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#FDF8F5'
      ctx.fillRect(0, 0, W, canvas.height)
      ctx.fillStyle = '#FF6B4A'
      ctx.fillRect(0, 0, W, 6)
      const logo = new Image()
      logo.crossOrigin = 'anonymous'
      await new Promise<void>(res => { logo.onload = () => res(); logo.onerror = () => res(); logo.src = '/logo.svg' })
      ctx.drawImage(logo, (W - LOGO_SIZE) / 2, 24, LOGO_SIZE, LOGO_SIZE)
      ctx.fillStyle = '#FF6B4A'
      ctx.font = '700 11px -apple-system, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('SPARTAN BY QUEUEAVE', W / 2, 94)
      const qr = new Image()
      qr.crossOrigin = 'anonymous'
      await new Promise<void>(res => { qr.onload = () => res(); qr.onerror = () => res(); qr.src = qrUrl })
      const qrX = (W - QR_SIZE) / 2
      ctx.fillStyle = '#FFFFFF'
      roundRect(ctx, qrX - 16, 108, QR_SIZE + 32, QR_SIZE + 32, 16)
      ctx.fill()
      ctx.drawImage(qr, qrX, 124, QR_SIZE, QR_SIZE)
      ctx.fillStyle = '#1A1A1A'
      ctx.font = '800 18px -apple-system, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(name, W / 2, 430)
      ctx.fillStyle = '#A0A0A0'
      ctx.font = '500 11px -apple-system, sans-serif'
      ctx.fillText('spartan.queueave.com', W / 2, 452)
      const url = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = url
      a.download = `spartan-qr-${name.replace(/\s+/g, '-').toLowerCase()}.png`
      a.click()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10" style={{ backgroundColor: '#FDF8F5' }}>
      <div className="w-full max-w-sm space-y-4">

        {/* Profile card */}
        <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 4px 32px rgba(0,0,0,.08)' }}>
          <div className="h-1.5 w-full" style={{ backgroundColor: '#FF6B4A' }} />

          <div className="p-6 space-y-5">
            {/* Avatar + name */}
            <div className="flex flex-col items-center space-y-3">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-20 h-20 rounded-2xl object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black"
                  style={{ backgroundColor: 'rgba(255,107,74,.12)', color: '#FF6B4A' }}>
                  {name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                </div>
              )}
              <div className="text-center">
                <h1 className="text-xl font-black" style={{ color: '#1A1A1A' }}>{name}</h1>
                <p className="text-xs mt-0.5" style={{ color: '#A0A0A0' }}>Spartan Athlete</p>
              </div>
            </div>

            {/* Photo upload */}
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={avatarLoading}
                className="w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl border text-sm font-medium cursor-pointer transition-all hover:opacity-75 disabled:opacity-50"
                style={{ backgroundColor: '#FFFFFF', borderColor: 'rgba(0,0,0,.1)', color: '#1A1A1A' }}
              >
                <Camera className="w-4 h-4" style={{ color: '#6B6B6B' }} />
                {avatarLoading ? 'Uploading...' : avatarUrl ? 'Change profile photo' : 'Add a profile photo'}
              </button>
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              {avatarError && (
                <p className="text-xs px-4 py-2 rounded-xl text-center" style={{ backgroundColor: 'rgba(229,72,77,.1)', color: '#E5484D' }}>{avatarError}</p>
              )}
            </div>

            {/* QR code */}
            <div className="text-center space-y-3">
              <p className="text-xs" style={{ color: '#A0A0A0' }}>Your permanent athlete QR. Use it to join any Spartan event.</p>
              <div className="flex justify-center">
                <div className="rounded-2xl p-4 inline-block" style={{ backgroundColor: '#F5F0EB' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrUrl} alt="QR code" width={200} height={200} className="block" />
                </div>
              </div>
              <div className="space-y-2">
                <button type="button" onClick={saveQr} disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold cursor-pointer transition-all hover:opacity-80 disabled:opacity-50"
                  style={{ backgroundColor: 'rgba(255,107,74,.1)', color: '#FF6B4A' }}>
                  <Download className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save QR Code'}
                </button>
                <button type="button"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold cursor-pointer transition-all hover:opacity-80"
                  style={{ backgroundColor: 'rgba(255,107,74,.06)', color: '#FF6B4A' }}
                  onClick={() => alert('To add to home screen: tap the Share button in your browser, then "Add to Home Screen".')}>
                  <Smartphone className="w-4 h-4" />
                  Save to Home Screen
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Most recent event */}
        {enrollments[0]?.event && (() => {
          const e = enrollments[0]
          const badge = EVENT_STATUS[e.event!.status] ?? EVENT_STATUS.draft
          return (
            <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 4px 32px rgba(0,0,0,.08)' }}>
              <div className="h-1.5 w-full" style={{ backgroundColor: '#FF6B4A' }} />
              <div className="p-6 space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#A0A0A0' }}>Current Event</h2>
                <div className="rounded-2xl p-4 space-y-2" style={{ backgroundColor: '#F5F0EB' }}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-base font-black leading-snug" style={{ color: '#1A1A1A' }}>{e.event!.name}</p>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: badge.bg, color: badge.color }}>
                      {badge.label}
                    </span>
                  </div>
                  {e.event!.date && (
                    <div className="flex items-center gap-2 text-sm" style={{ color: '#6B6B6B' }}>
                      <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: '#FF6B4A' }} />
                      {formatDate(e.event!.date)}
                    </div>
                  )}
                  {e.event!.venue && (
                    <div className="flex items-center gap-2 text-sm" style={{ color: '#6B6B6B' }}>
                      <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: '#FF6B4A' }} />
                      {e.event!.venue}
                    </div>
                  )}
                  {e.checkedIn && (
                    <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: '#00896E' }}>
                      <Check className="w-4 h-4" /> Checked in
                    </div>
                  )}
                </div>
                <Link href={`/p/${e.participantId}`}
                  className="w-full flex items-center justify-center py-3 rounded-full text-sm font-semibold transition-all hover:opacity-80"
                  style={{ backgroundColor: '#FF6B4A', color: '#FFFFFF' }}>
                  View my profile
                </Link>
              </div>
            </div>
          )
        })()}

        <p className="text-center text-xs" style={{ color: '#A0A0A0' }}>
          Powered by <span className="font-semibold" style={{ color: '#FF6B4A' }}>QueueAve</span>
        </p>
      </div>
    </div>
  )
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}
