'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Calendar, MapPin, Users, Copy, Check, Share2,
  ClipboardList, BarChart2, ChevronDown, ChevronUp,
} from 'lucide-react'
import { toggleCheckIn, approveParticipant, rejectParticipant } from '@/app/actions/participants'

type Participant = {
  id: string
  name: string
  checked_in: boolean
  group_id: string | null
  status: string | null
}
type Group = { id: string; name: string }
type Props = {
  event: {
    id: string
    name: string
    status: string
    date: string | null
    venue: string | null
    organizer_id: string
  }
  participants: Participant[]
  groups: Group[]
  sessionCount: number
  isOwner: boolean
}

const COLLAPSE_THRESHOLD = 8
const INITIAL_VISIBLE = 6

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string; dot?: string }> = {
  draft:     { label: 'Draft',     bg: 'rgba(255,184,0,.12)',   color: '#9B7800' },
  open:      { label: 'Open',      bg: 'rgba(0,191,165,.12)',   color: '#00896E', dot: '#00BFA5' },
  completed: { label: 'Completed', bg: 'var(--subtle)',         color: 'var(--muted)' },
}

function formatDate(d: string | null) {
  if (!d) return null
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function ParticipantAvatar({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
      style={{ backgroundColor: 'rgba(255,107,74,.12)', color: '#FF6B4A' }}>
      {initials}
    </div>
  )
}

export function EventDashboard({ event, participants, groups, sessionCount, isOwner }: Props) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)
  const [, startToggle] = useTransition()
  const [, startAction] = useTransition()

  const badge = STATUS_BADGE[event.status] ?? STATUS_BADGE.draft
  const checkedIn = participants.filter(p => p.checked_in).length
  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/join/${event.id}`
    : `/join/${event.id}`

  const handleCopy = async () => {
    const url = `${window.location.origin}/join/${event.id}`
    try { await navigator.clipboard.writeText(url) } catch { window.prompt('Copy this link:', url) }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/join/${event.id}`
    if (navigator.share) {
      try { await navigator.share({ title: event.name, text: `Join ${event.name} on Spartan`, url }) } catch { /* cancelled */ }
    } else {
      handleCopy()
    }
  }

  const handleToggleCheckIn = (participantId: string, currentState: boolean) => {
    setTogglingId(participantId)
    startToggle(async () => {
      await toggleCheckIn(participantId, event.id, !currentState)
      router.refresh()
      setTogglingId(null)
    })
  }

  const handleApprove = (participantId: string) => {
    setActionId(participantId)
    startAction(async () => {
      await approveParticipant(participantId, event.id)
      router.refresh()
      setActionId(null)
    })
  }

  const handleReject = (participantId: string) => {
    setActionId(participantId)
    startAction(async () => {
      await rejectParticipant(participantId, event.id)
      router.refresh()
      setActionId(null)
    })
  }

  const pendingCount = participants.filter(p => !p.status || p.status === 'pending').length
  const visibleParticipants = participants.length > COLLAPSE_THRESHOLD && !showAll
    ? participants.slice(0, INITIAL_VISIBLE)
    : participants

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm mb-4 hover:opacity-70 transition-opacity"
          style={{ color: 'var(--muted)' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold truncate" style={{ color: 'var(--fg)' }}>
                {event.name}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
                style={{ backgroundColor: badge.bg, color: badge.color }}>
                {badge.dot && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: badge.dot }} />}
                {badge.label}
              </span>
            </div>

            {/* Metadata chips */}
            <div className="flex flex-wrap items-center gap-3 mt-2">
              {event.date && (
                <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--muted)' }}>
                  <Calendar className="w-3.5 h-3.5" />{formatDate(event.date)}
                </span>
              )}
              {event.venue && (
                <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--muted)' }}>
                  <MapPin className="w-3.5 h-3.5 text-[#FF6B4A]" />{event.venue}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--muted)' }}>
                <Users className="w-3.5 h-3.5" />
                {participants.length} {participants.length === 1 ? 'athlete' : 'athletes'}
                {checkedIn > 0 && <span style={{ color: '#00BFA5' }}> · {checkedIn} checked in</span>}
              </span>
            </div>
          </div>

          {isOwner && (
            <Link href={`/events/${event.id}/edit`}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-70 transition-opacity"
              style={{ color: 'var(--muted)', border: '1px solid var(--border)' }}>
              Edit
            </Link>
          )}
        </div>
      </div>

      {/* ── Share bar (open events only) ── */}
      {event.status === 'open' && isOwner && (
        <div className="flex items-center gap-2 p-3.5 rounded-2xl border" style={{ backgroundColor: 'var(--subtle)', borderColor: 'var(--border)' }}>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--muted)' }}>Join link</p>
            <p className="text-sm font-mono truncate" style={{ color: 'var(--fg)' }}>{joinUrl}</p>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex-shrink-0"
            style={copied
              ? { backgroundColor: 'rgba(0,191,165,.12)', color: '#00896E' }
              : { backgroundColor: 'var(--card)', color: 'var(--muted)', border: '1px solid var(--border)' }}
          >
            {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
          </button>
          <button
            onClick={handleShare}
            className="p-2 rounded-xl transition-all cursor-pointer flex-shrink-0 hover:opacity-70"
            style={{ backgroundColor: 'var(--card)', color: '#FF6B4A', border: '1px solid var(--border)' }}
            title="Share"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Quick action cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Link href={`/events/${event.id}/sessions`}
          className="flex items-center gap-3 p-4 rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-sm"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'rgba(255,107,74,.1)', color: '#FF6B4A' }}>
            <ClipboardList className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>Sessions</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>{sessionCount} recorded</p>
          </div>
        </Link>

        <Link href={`/events/${event.id}/groups`}
          className="flex items-center gap-3 p-4 rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-sm"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'rgba(0,191,165,.1)', color: '#00BFA5' }}>
            <Users className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>Groups</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>{groups.length} defined</p>
          </div>
        </Link>

        <Link href={`/events/${event.id}/progress`}
          className="col-span-2 sm:col-span-1 flex items-center gap-3 p-4 rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-sm"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'rgba(255,184,0,.1)', color: '#FFB800' }}>
            <BarChart2 className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>Progress</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Charts and trends</p>
          </div>
        </Link>
      </div>

      {/* ── Participant roster ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--muted)' }}>
            Athletes
            <span className="px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ backgroundColor: 'var(--subtle)', color: 'var(--muted)' }}>
              {participants.length}
            </span>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ backgroundColor: 'rgba(255,184,0,.15)', color: '#9B7800' }}>
                {pendingCount} pending
              </span>
            )}
          </h2>
          {isOwner && event.status === 'open' && (
            <Link href={`/events/${event.id}/participants`}
              className="text-xs font-medium hover:opacity-70"
              style={{ color: '#FF6B4A' }}>
              Manage
            </Link>
          )}
        </div>

        {participants.length === 0 ? (
          <div className="text-center py-10 rounded-2xl border" style={{ borderColor: 'var(--border)', borderStyle: 'dashed' }}>
            <Users className="w-8 h-8 mx-auto mb-2" style={{ color: 'rgba(107,107,107,.3)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>No athletes yet</p>
            {event.status === 'open' && isOwner && (
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Share the join link above to get registrations.</p>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {visibleParticipants.map(p => {
                const group = groups.find(g => g.id === p.group_id)
                return (
                  <div key={p.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all"
                    style={{
                      backgroundColor: 'var(--card)',
                      borderColor: (!p.status || p.status === 'pending') ? 'rgba(255,184,0,.3)' : 'var(--border)',
                    }}>
                    <ParticipantAvatar name={p.name} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--fg)' }}>{p.name}</p>
                      {group
                        ? <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>{group.name}</p>
                        : (!p.status || p.status === 'pending') && (
                          <p className="text-xs" style={{ color: '#9B7800' }}>Pending approval</p>
                        )
                      }
                      {group && (!p.status || p.status === 'pending') && (
                        <p className="text-xs" style={{ color: '#9B7800' }}>Pending approval</p>
                      )}
                    </div>
                    {isOwner && (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {(!p.status || p.status === 'pending') ? (
                          <>
                            <button
                              onClick={() => handleApprove(p.id)}
                              disabled={actionId === p.id}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                              style={{ backgroundColor: 'rgba(0,191,165,.12)', color: '#00896E' }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(p.id)}
                              disabled={actionId === p.id}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                              style={{ backgroundColor: 'rgba(229,72,77,.1)', color: '#E5484D' }}
                            >
                              Reject
                            </button>
                          </>
                        ) : p.status === 'approved' ? (
                          <button
                            onClick={() => handleToggleCheckIn(p.id, p.checked_in)}
                            disabled={togglingId === p.id}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                            style={p.checked_in
                              ? { backgroundColor: 'rgba(0,191,165,.12)', color: '#00896E' }
                              : { backgroundColor: 'var(--subtle)', color: 'var(--muted)' }}
                          >
                            {p.checked_in ? <span className="flex items-center gap-1"><Check className="w-3 h-3" /> In</span> : 'Check in'}
                          </button>
                        ) : (
                          <span className="px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                            style={{ backgroundColor: 'rgba(229,72,77,.1)', color: '#E5484D' }}>
                            Rejected
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {participants.length > COLLAPSE_THRESHOLD && (
              <button
                onClick={() => setShowAll(v => !v)}
                className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium cursor-pointer hover:opacity-70 transition-opacity"
                style={{ backgroundColor: 'var(--subtle)', color: 'var(--muted)' }}
              >
                {showAll
                  ? <><ChevronUp className="w-4 h-4" /> Show less</>
                  : <><ChevronDown className="w-4 h-4" /> Show all {participants.length} athletes</>}
              </button>
            )}
          </>
        )}
      </div>

    </div>
  )
}
