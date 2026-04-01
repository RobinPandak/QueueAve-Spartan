'use client'

interface SlideInProps {
  show?: boolean
  direction: 'left' | 'right'
  children: React.ReactNode
}

export default function SlideIn({ show = true, direction, children }: SlideInProps) {
  if (!show) return null
  return (
    <div style={{ animation: `slide-in-${direction} 0.25s ease-out both` }}>
      {children}
    </div>
  )
}
