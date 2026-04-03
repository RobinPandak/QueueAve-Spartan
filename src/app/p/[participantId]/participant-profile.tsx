'use client'

import { useState } from 'react'
import { Check, Clock, Camera, Calendar, Download, MapPin, Smartphone } from 'lucide-react'

type EventData = { name: string; date: string | null; start_time: string | null; venue: string | null } | null

type Props = {
  participantId: string
  name: string
  status: string | null
  event: EventData
  qrUrl: string
  profileUrl: string
}

function formatDate(d: string | null) {
  if (!d) return null
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatTime(t: string | null) {
  if (!t) return null
  return new Date('1970-01-01T' + t).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function ParticipantProfile({ participantId: _participantId, name, status, event, qrUrl }: Props) {
  const [saving, setSaving] = useState(false)
  const isPending = !status || status === 'pending'
  const isApproved = status === 'approved'

  async function saveQr() {
    setSaving(true)
    try {
      const canvas = document.createElement('canvas')
      const W = 480
      const QR_SIZE = 280
      const LOGO_SIZE = 48
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
      const cardPad = 16
      roundRect(ctx, qrX - cardPad, 108, QR_SIZE + cardPad * 2, QR_SIZE + cardPad * 2, 16)
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
      <div className="w-full max-w-sm">

        {/* Card — matches join page */}
        <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 4px 32px rgba(0,0,0,.08)' }}>

          {/* Coral top bar */}
          <div className="h-1.5 w-full" style={{ backgroundColor: '#FF6B4A' }} />

          <div className="p-6 space-y-5">

            {/* Event title */}
            {event && (
              <h1 className="text-2xl font-black leading-tight text-center" style={{ color: '#1A1A1A' }}>
                {event.name}
              </h1>
            )}

            {/* Event info card */}
            {event && (
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
                    {formatTime(event.start_time)}
                  </div>
                )}
                {event.venue && (
                  <div className="flex items-center gap-2.5 text-sm" style={{ color: '#6B6B6B' }}>
                    <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: '#FF6B4A' }} />
                    {event.venue}
                  </div>
                )}
              </div>
            )}

            {/* Status icon + heading */}
            <div className="flex flex-col items-center space-y-3 pt-1">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: isPending ? '#FFB800' : '#FF6B4A' }}>
                {isPending
                  ? <Clock className="w-7 h-7 text-white" strokeWidth={2.5} />
                  : <Check className="w-7 h-7 text-white" strokeWidth={3} />}
              </div>
              <div className="text-center space-y-1">
                <p className="text-lg font-black" style={{ color: '#1A1A1A' }}>
                  {isPending ? 'Waiting for approval' : isApproved ? "You're in!" : 'Registration received'}
                </p>
                <p className="text-sm" style={{ color: '#6B6B6B' }}>
                  {isPending ? 'Your coach will confirm your spot soon.' : `Welcome, ${name}`}
                </p>
              </div>
            </div>

            {/* Add profile photo */}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl border text-sm font-medium cursor-pointer transition-all hover:opacity-75"
              style={{ backgroundColor: '#FFFFFF', borderColor: 'rgba(0,0,0,.1)', color: '#1A1A1A' }}
            >
              <Camera className="w-4 h-4" style={{ color: '#6B6B6B' }} />
              Add a profile photo
            </button>

            {/* QR section */}
            <div className="text-center space-y-4">
              <p className="text-sm" style={{ color: '#A0A0A0' }}>
                {isPending ? 'Your athlete profile QR — save it for check-in' : 'Save your QR for instant check-in'}
              </p>

              <div className="flex justify-center">
                <div className="rounded-2xl p-4 inline-block" style={{ backgroundColor: '#F5F0EB' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrUrl} alt="QR code" width={200} height={200} className="block" />
                </div>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={saveQr}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-semibold cursor-pointer transition-all hover:opacity-80 disabled:opacity-50"
                  style={{ backgroundColor: 'rgba(255,107,74,.1)', color: '#FF6B4A' }}
                >
                  <Download className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save QR Code'}
                </button>

                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-semibold cursor-pointer transition-all hover:opacity-80"
                  style={{ backgroundColor: 'rgba(255,107,74,.06)', color: '#FF6B4A' }}
                  onClick={() => alert('To add to home screen: tap the Share button in your browser, then "Add to Home Screen".')}
                >
                  <Smartphone className="w-4 h-4" />
                  Save to Home Screen
                </button>
              </div>
            </div>

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
