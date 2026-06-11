'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Upload, Keyboard, ArrowRight, X } from 'lucide-react'
import jsQR from 'jsqr'

function resolveInput(text: string): string | null {
  const playerMatch = text.match(/\/player\/([0-9a-f-]{36})/i)
  if (playerMatch) return `/player/${playerMatch[1]}`
  const legacyMatch = text.match(/\/p\/([0-9a-f-]{36})/i)
  if (legacyMatch) return `/p/${legacyMatch[1]}`
  const uuid = text.trim().match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  if (uuid) return `/player/${uuid[0]}`
  return null
}

export function LookupClient() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [mode, setMode] = useState<'choose' | 'camera' | 'code'>('choose')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cameraLoading, setCameraLoading] = useState(false)

  function stopCamera() {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  useEffect(() => () => stopCamera(), [])

  function handleResult(text: string) {
    stopCamera()
    const dest = resolveInput(text)
    if (dest) {
      router.push(dest)
    } else {
      setError('That is not a valid Spartan athlete QR code or player code.')
      setMode('choose')
    }
  }

  async function startCamera() {
    setCameraLoading(true)
    setError(null)
    setMode('camera')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        scanFrame()
      }
    } catch {
      setError('Camera access denied. Try uploading an image instead.')
      setMode('choose')
    } finally {
      setCameraLoading(false)
    }
  }

  function scanFrame() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scanFrame)
      return
    }
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const qr = jsQR(imageData.data, imageData.width, imageData.height)
    if (qr?.data) {
      handleResult(qr.data)
    } else {
      rafRef.current = requestAnimationFrame(scanFrame)
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const qr = jsQR(imageData.data, imageData.width, imageData.height)
      URL.revokeObjectURL(url)
      if (qr?.data) {
        handleResult(qr.data)
      } else {
        setError('No QR code found in this image. Try a clearer photo.')
      }
    }
    img.src = url
    e.target.value = ''
  }

  function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return
    setError(null)
    handleResult(code)
  }

  if (mode === 'camera') {
    return (
      <div className="max-w-md mx-auto space-y-3">
        <div className="relative rounded-2xl overflow-hidden" style={{ backgroundColor: '#000', aspectRatio: '1' }}>
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-48 border-2 rounded-2xl" style={{ borderColor: '#FF6B4A' }}>
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 rounded-tl-xl" style={{ borderColor: '#FF6B4A' }} />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 rounded-tr-xl" style={{ borderColor: '#FF6B4A' }} />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 rounded-bl-xl" style={{ borderColor: '#FF6B4A' }} />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 rounded-br-xl" style={{ borderColor: '#FF6B4A' }} />
            </div>
          </div>
        </div>
        <canvas ref={canvasRef} className="hidden" />
        <p className="text-xs text-center" style={{ color: 'var(--muted)' }}>
          Align the QR code within the frame
        </p>
        <button
          type="button"
          onClick={() => { stopCamera(); setMode('choose') }}
          className="w-full py-3 rounded-full text-sm font-medium cursor-pointer"
          style={{ backgroundColor: 'var(--subtle)', color: 'var(--muted)' }}
        >
          Cancel
        </button>
      </div>
    )
  }

  if (mode === 'code') {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <button
          type="button"
          onClick={() => { setMode('choose'); setError(null) }}
          className="flex items-center gap-1.5 text-sm cursor-pointer hover:opacity-75 transition-opacity"
          style={{ color: 'var(--muted)' }}
        >
          <X className="w-4 h-4" /> Back
        </button>
        <form onSubmit={handleCodeSubmit} className="space-y-3">
          <label className="block text-sm font-medium" style={{ color: 'var(--fg)' }}>
            Player code or profile link
          </label>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Paste your profile link or player code"
            autoFocus
            className="w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[#FF6B4A]/40"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--fg)' }}
          />
          <button
            type="submit"
            disabled={!code.trim()}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold text-white cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#FF6B4A' }}
          >
            Find athlete
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
        {error && (
          <p className="text-xs px-4 py-2.5 rounded-xl text-center" style={{ backgroundColor: 'rgba(229,72,77,.1)', color: '#E5484D' }}>
            {error}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <button
          type="button"
          onClick={startCamera}
          disabled={cameraLoading}
          className="group rounded-2xl border p-6 text-left cursor-pointer transition-all hover:shadow-md hover:border-[#00BFA5] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(0,191,165,0.12)' }}>
            <Camera className="w-6 h-6 text-[#00BFA5]" />
          </div>
          <h3 className="font-bold mb-1" style={{ color: 'var(--fg)' }}>Scan QR Code</h3>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Use your camera to scan an athlete QR code</p>
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="group rounded-2xl border p-6 text-left cursor-pointer transition-all hover:shadow-md hover:border-[#FF6B4A] hover:-translate-y-0.5 active:scale-[0.98]"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(255,107,74,0.12)' }}>
            <Upload className="w-6 h-6 text-[#FF6B4A]" />
          </div>
          <h3 className="font-bold mb-1" style={{ color: 'var(--fg)' }}>Upload QR Photo</h3>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Upload an image of an athlete QR code</p>
        </button>

        <button
          type="button"
          onClick={() => { setMode('code'); setError(null) }}
          className="group rounded-2xl border p-6 text-left cursor-pointer transition-all hover:shadow-md hover:border-[#FFB800] hover:-translate-y-0.5 active:scale-[0.98]"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(255,184,0,0.12)' }}>
            <Keyboard className="w-6 h-6 text-[#FFB800]" />
          </div>
          <h3 className="font-bold mb-1" style={{ color: 'var(--fg)' }}>Enter Code</h3>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Type in your player code manually</p>
        </button>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

      {error && (
        <p className="text-xs px-4 py-2.5 rounded-xl text-center max-w-md mx-auto" style={{ backgroundColor: 'rgba(229,72,77,.1)', color: '#E5484D' }}>
          {error}
        </p>
      )}
    </div>
  )
}
