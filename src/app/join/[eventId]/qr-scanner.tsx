'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Upload, X } from 'lucide-react'
import jsQR from 'jsqr'
import { enrollPlayerById } from '@/app/actions/participants'

type Props = { eventId: string; onBack: () => void }

export function QrScanner({ eventId, onBack }: Props) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [mode, setMode] = useState<'choose' | 'camera' | 'upload'>('choose')
  const [error, setError] = useState<string | null>(null)
  const [cameraLoading, setCameraLoading] = useState(false)

  function stopCamera() {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  useEffect(() => () => stopCamera(), [])

  async function handleResult(url: string) {
    stopCamera()
    try {
      // New global player QR
      const playerMatch = url.match(/\/player\/([0-9a-f-]{36})/i)
      if (playerMatch) {
        const result = await enrollPlayerById(playerMatch[1], eventId)
        if ('error' in result) {
          setError(result.error)
          setMode('choose')
        } else {
          router.push(`/player/${playerMatch[1]}`)
        }
        return
      }
      // Legacy event-specific QR
      const legacyMatch = url.match(/\/p\/([0-9a-f-]{36})/i)
      if (legacyMatch) {
        router.push(`/p/${legacyMatch[1]}`)
        return
      }
      setError('This QR code is not a valid Spartan athlete profile.')
      setMode('choose')
    } catch {
      setError('Something went wrong. Please try again.')
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
    const code = jsQR(imageData.data, imageData.width, imageData.height)
    if (code?.data) {
      handleResult(code.data)
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
      const code = jsQR(imageData.data, imageData.width, imageData.height)
      URL.revokeObjectURL(url)
      if (code?.data) {
        handleResult(code.data)
      } else {
        setError('No QR code found in this image. Try a clearer photo.')
      }
    }
    img.src = url
  }

  return (
    <div className="space-y-4">
      <button type="button" onClick={() => { stopCamera(); onBack() }}
        className="flex items-center gap-1.5 text-sm cursor-pointer hover:opacity-75 transition-opacity"
        style={{ color: '#6B6B6B' }}>
        <X className="w-4 h-4" /> Close
      </button>

      {mode === 'choose' && (
        <div className="space-y-3">
          <p className="text-sm text-center" style={{ color: '#6B6B6B' }}>
            Scan your athlete QR code to check in
          </p>
          <button
            type="button"
            onClick={startCamera}
            disabled={cameraLoading}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all hover:opacity-90 cursor-pointer disabled:opacity-50"
            style={{ backgroundColor: '#FF6B4A' }}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'rgba(255,255,255,.2)' }}>
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-white">Use Camera</p>
              <p className="text-xs text-white/80">Point at your QR code</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: '#F5F0EB' }}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#E8E0D8' }}>
              <Upload className="w-5 h-5" style={{ color: '#6B6B6B' }} />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold" style={{ color: '#1A1A1A' }}>Upload Image</p>
              <p className="text-xs" style={{ color: '#6B6B6B' }}>Choose a photo with your QR</p>
            </div>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          {error && (
            <p className="text-xs px-4 py-2.5 rounded-xl text-center"
              style={{ backgroundColor: 'rgba(229,72,77,.1)', color: '#E5484D' }}>
              {error}
            </p>
          )}
        </div>
      )}

      {mode === 'camera' && (
        <div className="space-y-3">
          <div className="relative rounded-2xl overflow-hidden" style={{ backgroundColor: '#000', aspectRatio: '1' }}>
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
            {/* Scanning overlay */}
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
          <p className="text-xs text-center" style={{ color: '#A0A0A0' }}>
            Align the QR code within the frame
          </p>
          <button type="button" onClick={() => { stopCamera(); setMode('choose') }}
            className="w-full py-3 rounded-full text-sm font-medium cursor-pointer"
            style={{ backgroundColor: '#F5F0EB', color: '#6B6B6B' }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
