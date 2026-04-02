'use client'

import { useState } from 'react'
import { registerParticipant } from '@/app/actions/participants'

type Group = { id: string; name: string; start_time: string | null }
type Platform = 'instagram' | 'facebook' | 'x' | 'tiktok'

type Props = {
  eventId: string
  groups: Group[]
  defaultPlatform: string
}

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'x',        label: 'X' },
  { value: 'tiktok',   label: 'TikTok' },
]

const inputCls = 'w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/40 transition-all'
const inputSty = { backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--fg)' } as const
const labelCls = 'block text-xs font-bold uppercase tracking-wider mb-2'
const labelSty = { color: 'var(--fg)' } as const

export function JoinForm({ eventId, groups, defaultPlatform }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [platform, setPlatform] = useState<Platform>(
    (PLATFORMS.find(p => p.value === defaultPlatform)?.value) ?? 'instagram'
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const rawHandle = (fd.get('social_handle') as string).trim()
    const socialHandle = rawHandle
      ? `${platform}:${rawHandle.startsWith('@') ? rawHandle : '@' + rawHandle}`
      : null
    const result = await registerParticipant(
      eventId,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className={labelCls} style={labelSty}>Full name</label>
        <input
          name="name"
          required
          placeholder="e.g. Maria Santos"
          className={inputCls}
          style={inputSty}
          autoFocus
        />
      </div>

      {/* Group */}
      {groups.length > 0 && (
        <div>
          <label className={labelCls} style={labelSty}>
            Group <span className="text-xs font-normal normal-case tracking-normal" style={{ color: 'var(--muted)' }}>optional</span>
          </label>
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
        </div>
      )}

      {/* Email */}
      <div>
        <label className={labelCls} style={labelSty}>
          Email <span className="text-xs font-normal normal-case tracking-normal" style={{ color: 'var(--muted)' }}>optional</span>
        </label>
        <input
          name="email"
          type="email"
          placeholder="your@email.com"
          className={inputCls}
          style={inputSty}
        />
      </div>

      {/* Phone */}
      <div>
        <label className={labelCls} style={labelSty}>
          Phone <span className="text-xs font-normal normal-case tracking-normal" style={{ color: 'var(--muted)' }}>optional</span>
        </label>
        <input
          name="phone"
          type="tel"
          placeholder="+63 912 345 6789"
          className={inputCls}
          style={inputSty}
        />
      </div>

      {/* Social handle */}
      <div>
        <label className={labelCls} style={labelSty}>
          Social media <span className="text-xs font-normal normal-case tracking-normal" style={{ color: 'var(--muted)' }}>optional</span>
        </label>
        {/* Platform picker */}
        <div className="flex gap-1.5 mb-2 flex-wrap">
          {PLATFORMS.map(p => {
            const active = platform === p.value
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => setPlatform(p.value)}
                className="px-3 py-1.5 text-xs rounded-lg border transition-all cursor-pointer"
                style={{
                  backgroundColor: active ? 'rgba(255,107,74,.1)' : 'var(--card)',
                  borderColor: active ? '#FF6B4A' : 'var(--border)',
                  color: active ? '#FF6B4A' : 'var(--muted)',
                  fontWeight: active ? 600 : 400,
                }}
              >
                {p.label}
              </button>
            )
          })}
        </div>
        <input
          name="social_handle"
          placeholder="@yourhandle"
          className={inputCls}
          style={inputSty}
        />
      </div>

      {error && (
        <p className="text-sm px-4 py-2.5 rounded-xl" style={{ backgroundColor: 'rgba(229,72,77,.1)', color: '#E5484D' }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-full font-semibold text-white cursor-pointer transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{ backgroundColor: '#FF6B4A', boxShadow: '0 4px 14px rgba(255,107,74,.25)' }}
      >
        {loading ? (
          <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Registering...</>
        ) : (
          'Join Event'
        )}
      </button>
    </form>
  )
}
