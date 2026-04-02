'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Clock, Camera, Download, Smartphone, ArrowRight } from 'lucide-react'

type Props = {
  participantId: string
  name: string
  status: string | null
  qrUrl: string
  profileUrl: string
}

export function ParticipantProfile({ participantId, name, status, qrUrl, profileUrl }: Props) {
  const isPending = !status || status === 'pending'
  const isApproved = status === 'approved'
  const [saving, setSaving] = useState(false)

  async function saveQr() {
    setSaving(true)
    try {
      const res = await fetch(qrUrl)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `spartan-qr-${name.replace(/\s+/g, '-').toLowerCase()}.png`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10" style={{ backgroundColor: '#FDF8F5' }}>
      <div className="w-full max-w-sm space-y-5">

        {/* Status icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: isPending ? '#FFB800' : '#FF6B4A' }}>
            {isPending
              ? <Clock className="w-8 h-8 text-white" strokeWidth={2.5} />
              : <Check className="w-8 h-8 text-white" strokeWidth={3} />}
          </div>
        </div>

        {/* Heading */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black" style={{ color: '#1A1A1A' }}>
            {isPending ? 'Waiting for approval' : isApproved ? "You're in!" : 'Registration received'}
          </h1>
          <p className="text-sm" style={{ color: '#6B6B6B' }}>
            {isPending ? 'Your coach will confirm your spot soon.' : `Welcome, ${name}`}
          </p>
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
            <div className="rounded-2xl p-4 inline-block" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 4px 20px rgba(0,0,0,.08)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUrl} alt="QR code" width={200} height={200} className="block" />
            </div>
          </div>

          {/* Action buttons */}
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
              onClick={() => {
                if ('standalone' in navigator) {
                  alert('To add to home screen: tap the Share button in your browser, then "Add to Home Screen".')
                }
              }}
            >
              <Smartphone className="w-4 h-4" />
              Save to Home Screen
            </button>
          </div>
        </div>

        {/* Progress link */}
        <Link
          href={`/p/${participantId}/progress`}
          className="flex items-center justify-between w-full px-5 py-4 rounded-2xl transition-all hover:opacity-80"
          style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}
        >
          <div>
            <p className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>My progress</p>
            <p className="text-xs mt-0.5" style={{ color: '#6B6B6B' }}>View your training results and trends</p>
          </div>
          <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: '#A0A0A0' }} />
        </Link>

        {/* Footer */}
        <p className="text-center text-xs" style={{ color: '#A0A0A0' }}>
          Powered by <span className="font-semibold" style={{ color: '#FF6B4A' }}>QueueAve</span>
        </p>

      </div>
    </div>
  )
}
