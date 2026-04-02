'use client'

import { useState } from 'react'
import { registerParticipant } from '@/app/actions/participants'

type Group = { id: string; name: string; start_time: string | null }

type Props = {
  eventId: string
  groups: Group[]
}

const inputCls = 'w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/40 transition-all'
const inputSty = { backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--fg)' } as const
const labelCls = 'block text-xs font-bold uppercase tracking-wider mb-2'
const labelSty = { color: 'var(--fg)' } as const

export function JoinForm({ eventId, groups }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const result = await registerParticipant(
      eventId,
      (fd.get('name') as string).trim(),
      (fd.get('group_id') as string) || null,
      (fd.get('email') as string).trim() || null,
      (fd.get('phone') as string).trim() || null,
    )
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
    // on success, registerParticipant redirects — no need to handle here
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
