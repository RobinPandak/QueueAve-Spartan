'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Calendar, MapPin, Users, Copy, Check, Share2,
  BarChart2, ChevronDown, ChevronUp, Download,
  Send, Play, UserPlus, UserMinus, X,
} from 'lucide-react'
import {
  approveParticipant, rejectParticipant,
  addParticipantManually, removeParticipant,
  approveAllParticipants, sendEventGuide,
} from '@/app/actions/participants'
import { updateEventStatus } from '@/app/actions/events'
import { downloadParticipantsCsv } from '@/lib/export'
import { useRealtimeParticipants } from './use-realtime-participants'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

type Participant = {
  id: string
  player_id: string
  name: string
  checked_in: boolean
  group_id: string | null
  status: string | null
  email?: string | null
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
  isOwner: boolean
}

const COLLAPSE_THRESHOLD = 8
const INITIAL_VISIBLE = 6

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string; dot?: string }> = {
  draft:       { label: 'Draft',       bg: 'rgba(255,184,0,.12)',   color: '#9B7800' },
  open:        { label: 'Open',        bg: 'rgba(0,191,165,.12)',   color: '#00896E', dot: '#00BFA5' },
  in_progress: { label: 'In Progress', bg: 'rgba(255,107,74,.12)',  color: '#C44A2A', dot: '#FF6B4A' },
  completed:   { label: 'Completed',   bg: 'var(--subtle)',         color: 'var(--muted)' },
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

const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/30'
const inputSty = { backgroundColor: 'var(--subtle)', border: '1px solid var(--border)', color: 'var(--fg)' } as const

export function EventDashboard({ event, participants, groups, isOwner }: Props) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const [, startAction] = useTransition()

  // Export
  const [showExportMenu, setShowExportMenu] = useState(false)

  // Start event
  const [isStarting, setIsStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)

  // Add player
  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [addName, setAddName] = useState('')
  const [addEmail, setAddEmail] = useState('')
  const [addGroupId, setAddGroupId] = useState('')
  const [addError, setAddError] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  // Remove player
  const [removeTarget, setRemoveTarget] = useState<Participant | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)

  // Send guide
  const [showGuide, setShowGuide] = useState(false)
  const [guideArrival, setGuideArrival] = useState('15 minutes before start time')
  const [guideParking, setGuideParking] = useState('Street parking available nearby')
  const [guideAccess, setGuideAccess] = useState('Meet at the main entrance')
  const [guideRep, setGuideRep] = useState('')
  const [isSendingGuide, setIsSendingGuide] = useState(false)
  const [guideSent, setGuideSent] = useState<{ sent: number; skipped: number } | null>(null)

  // Realtime
  useRealtimeParticipants(event.id)

  const badge = STATUS_BADGE[event.status] ?? STATUS_BADGE.draft
  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/join/${event.id}`
    : `/join/${event.id}`

  const pendingParticipants = participants.filter(p => !p.status || p.status === 'pending')
  const pendingCount = pendingParticipants.length
  const visibleParticipants = participants.length > COLLAPSE_THRESHOLD && !showAll
    ? participants.slice(0, INITIAL_VISIBLE)
    : participants

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

  const handleApproveAll = () => {
    startAction(async () => {
      await approveAllParticipants(event.id)
      router.refresh()
    })
  }

  const handleStartEvent = async () => {
    setIsStarting(true)
    setStartError(null)
    const result = await updateEventStatus(event.id, 'in_progress')
    if ('error' in result) {
      setStartError(result.error)
      setIsStarting(false)
    } else {
      router.refresh()
      setIsStarting(false)
    }
  }

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddError(null)
    setIsAdding(true)
    try {
      const result = await addParticipantManually(event.id, addName, addEmail || null, addGroupId || null)
      if ('error' in result) { setAddError(result.error); return }
      setShowAddPlayer(false)
      setAddName(''); setAddEmail(''); setAddGroupId('')
      router.refresh()
    } catch {
      setAddError('Something went wrong.')
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemove = async () => {
    if (!removeTarget) return
    setIsRemoving(true)
    try {
      await removeParticipant(removeTarget.id, event.id)
      setRemoveTarget(null)
      router.refresh()
    } finally {
      setIsRemoving(false)
    }
  }

  const handleSendGuide = async () => {
    setIsSendingGuide(true)
    try {
      const result = await sendEventGuide(event.id, {
        arrivalNote: guideArrival,
        parkingNote: guideParking,
        accessNote: guideAccess,
        repName: guideRep,
      })
      setGuideSent(result)
    } finally {
      setIsSendingGuide(false)
    }
  }

  const isOpen = event.status === 'open'
  const isActive = event.status === 'in_progress'

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div>
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm mb-4 hover:opacity-70 transition-opacity" style={{ color: 'var(--muted)' }}>
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
                <Users className="w-3.5 h-3.5" />{participants.length} {participants.length === 1 ? 'athlete' : 'athletes'}
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

      {/* ── Action bar ── */}
      {isOwner && (isOpen || isActive) && (
        <div className="space-y-2">
          {/* Row 1: action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Export */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(v => !v)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer hover:opacity-80"
                style={{ backgroundColor: 'var(--card)', color: 'var(--muted)', border: '1px solid var(--border)' }}
              >
                <Download className="w-3.5 h-3.5" /> Export <ChevronDown className="w-3 h-3" />
              </button>
              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                  <div className="absolute left-0 top-full mt-1.5 z-20 w-44 rounded-xl shadow-lg overflow-hidden"
                    style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                    <button
                      className="w-full text-left px-4 py-2.5 text-sm hover:opacity-70 transition-opacity"
                      style={{ color: 'var(--fg)' }}
                      onClick={() => { setShowExportMenu(false); downloadParticipantsCsv(participants, groups, event.name) }}
                    >
                      All athletes (CSV)
                    </button>
                    <button
                      className="w-full text-left px-4 py-2.5 text-sm hover:opacity-70 transition-opacity border-t"
                      style={{ color: 'var(--fg)', borderColor: 'var(--border)' }}
                      onClick={() => {
                        setShowExportMenu(false)
                        downloadParticipantsCsv(
                          participants.filter(p => p.status === 'approved'),
                          groups,
                          event.name + '-approved',
                        )
                      }}
                    >
                      Approved only (CSV)
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Send Guide */}
            <button
              onClick={() => { setGuideSent(null); setShowGuide(true) }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer hover:opacity-80"
              style={{ backgroundColor: 'var(--card)', color: 'var(--muted)', border: '1px solid var(--border)' }}
            >
              <Send className="w-3.5 h-3.5" /> Send Guide
            </button>

            {/* Start Event */}
            {isOpen && (
              <div className="ml-auto flex items-center gap-2">
                {startError && (
                  <p className="text-xs" style={{ color: '#E5484D' }}>{startError}</p>
                )}
                <button
                  onClick={handleStartEvent}
                  disabled={isStarting}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all cursor-pointer hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: '#FF6B4A' }}
                >
                  <Play className="w-3.5 h-3.5" />
                  {isStarting ? 'Starting...' : 'Start Event'}
                </button>
              </div>
            )}
          </div>

          {/* Row 2: join link */}
          <div className="flex items-center gap-2 p-3 rounded-2xl border" style={{ backgroundColor: 'var(--subtle)', borderColor: 'var(--border)' }}>
            <p className="flex-1 text-sm font-mono truncate" style={{ color: 'var(--fg)' }}>{joinUrl}</p>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex-shrink-0"
              style={copied
                ? { backgroundColor: 'rgba(0,191,165,.12)', color: '#00896E' }
                : { backgroundColor: 'var(--card)', color: 'var(--muted)', border: '1px solid var(--border)' }}
            >
              {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
            </button>
            <button
              onClick={handleShare}
              className="p-1.5 rounded-xl transition-all cursor-pointer hover:opacity-70"
              style={{ backgroundColor: 'var(--card)', color: '#FF6B4A', border: '1px solid var(--border)' }}
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Quick action cards ── */}
      <div className="grid grid-cols-2 gap-3">

        <Link href={`/events/${event.id}/groups`}
          className="flex items-center gap-3 p-4 rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-sm"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(0,191,165,.1)', color: '#00BFA5' }}>
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
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255,184,0,.1)', color: '#FFB800' }}>
            <BarChart2 className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>Progress</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Charts and trends</p>
          </div>
        </Link>
      </div>

      {/* ── Athlete roster ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--muted)' }}>
            Athletes
            <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: 'var(--subtle)', color: 'var(--muted)' }}>
              {participants.length}
            </span>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(255,184,0,.15)', color: '#9B7800' }}>
                {pendingCount} pending
              </span>
            )}
          </h2>
          {isOwner && (
            <div className="flex items-center gap-2">
              {pendingCount > 0 && (
                <button
                  onClick={handleApproveAll}
                  className="text-xs font-medium px-2.5 py-1.5 rounded-lg cursor-pointer transition-all hover:opacity-80"
                  style={{ backgroundColor: 'rgba(0,191,165,.1)', color: '#00896E' }}
                >
                  Approve all
                </button>
              )}
              <button
                onClick={() => { setShowAddPlayer(true); setAddError(null) }}
                className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg cursor-pointer transition-all hover:opacity-80"
                style={{ backgroundColor: 'rgba(255,107,74,.1)', color: '#FF6B4A' }}
              >
                <UserPlus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          )}
        </div>

        {participants.length === 0 ? (
          <div className="text-center py-10 rounded-2xl border" style={{ borderColor: 'var(--border)', borderStyle: 'dashed' }}>
            <Users className="w-8 h-8 mx-auto mb-2" style={{ color: 'rgba(107,107,107,.3)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>No athletes yet</p>
            {isOpen && isOwner && (
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Share the join link above or add one manually.</p>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {visibleParticipants.map(p => {
                const group = groups.find(g => g.id === p.group_id)
                const isPending = !p.status || p.status === 'pending'
                const isApproved = p.status === 'approved'
                return (
                  <div key={p.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all"
                    style={{
                      backgroundColor: 'var(--card)',
                      borderColor: isPending ? 'rgba(255,184,0,.3)' : 'var(--border)',
                    }}>
                    <ParticipantAvatar name={p.name} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--fg)' }}>{p.name}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>
                        {group ? group.name : isPending ? 'Pending approval' : isApproved ? 'Approved' : 'Rejected'}
                      </p>
                    </div>
                    {isOwner && (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isPending ? (
                          <>
                            <button onClick={() => handleApprove(p.id)} disabled={actionId === p.id}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                              style={{ backgroundColor: 'rgba(0,191,165,.12)', color: '#00896E' }}>
                              Approve
                            </button>
                            <button onClick={() => handleReject(p.id)} disabled={actionId === p.id}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                              style={{ backgroundColor: 'rgba(229,72,77,.1)', color: '#E5484D' }}>
                              Reject
                            </button>
                          </>
                        ) : isApproved ? (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                            style={{ backgroundColor: 'rgba(0,191,165,.1)', color: '#00896E' }}>
                            <Check className="w-3 h-3 inline mr-0.5" />Approved
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                            style={{ backgroundColor: 'rgba(229,72,77,.1)', color: '#E5484D' }}>
                            Rejected
                          </span>
                        )}
                        <button onClick={() => setRemoveTarget(p)}
                          className="p-1.5 rounded-lg cursor-pointer hover:opacity-70 transition-opacity"
                          style={{ color: 'var(--muted)' }} title="Remove athlete">
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
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

      {/* ── Add Player Dialog ── */}
      <Dialog open={showAddPlayer} onOpenChange={v => { setShowAddPlayer(v); setAddError(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Athlete</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPlayer} className="space-y-3 mt-2">
            <input
              required
              placeholder="Full name"
              value={addName}
              onChange={e => setAddName(e.target.value)}
              className={inputCls}
              style={inputSty}
            />
            <input
              type="email"
              placeholder="Email (optional)"
              value={addEmail}
              onChange={e => setAddEmail(e.target.value)}
              className={inputCls}
              style={inputSty}
            />
            {groups.length > 0 && (
              <select
                value={addGroupId}
                onChange={e => setAddGroupId(e.target.value)}
                className={`${inputCls} cursor-pointer`}
                style={inputSty}
              >
                <option value="">No group</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            )}
            {addError && (
              <p className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(229,72,77,.1)', color: '#E5484D' }}>
                {addError}
              </p>
            )}
            <DialogFooter>
              <button type="button" onClick={() => setShowAddPlayer(false)}
                className="px-4 py-2 rounded-xl text-sm cursor-pointer hover:opacity-70"
                style={{ color: 'var(--muted)' }}>
                Cancel
              </button>
              <button type="submit" disabled={isAdding}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: '#FF6B4A' }}>
                {isAdding ? 'Adding...' : 'Add Athlete'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Remove Confirmation Dialog ── */}
      <Dialog open={!!removeTarget} onOpenChange={v => !v && setRemoveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Athlete</DialogTitle>
          </DialogHeader>
          <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>
            Remove <strong style={{ color: 'var(--fg)' }}>{removeTarget?.name}</strong> from this event? This cannot be undone.
          </p>
          <DialogFooter className="mt-4">
            <button onClick={() => setRemoveTarget(null)}
              className="px-4 py-2 rounded-xl text-sm cursor-pointer hover:opacity-70"
              style={{ color: 'var(--muted)' }}>
              Cancel
            </button>
            <button onClick={handleRemove} disabled={isRemoving}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: '#E5484D' }}>
              {isRemoving ? 'Removing...' : 'Remove'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Send Guide Dialog ── */}
      <Dialog open={showGuide} onOpenChange={v => { setShowGuide(v); setGuideSent(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Event Guide</DialogTitle>
          </DialogHeader>
          {guideSent ? (
            <div className="text-center py-6 space-y-2">
              <p className="text-2xl">✓</p>
              <p className="font-semibold" style={{ color: 'var(--fg)' }}>Guide sent!</p>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                {guideSent.sent} sent · {guideSent.skipped} skipped (no email)
              </p>
              <button onClick={() => setShowGuide(false)}
                className="mt-3 px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer"
                style={{ backgroundColor: '#FF6B4A' }}>
                Done
              </button>
            </div>
          ) : (
            <div className="space-y-3 mt-2">
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Sends to all approved athletes with an email address.
              </p>
              {[
                { label: 'Arrive', value: guideArrival, set: setGuideArrival, placeholder: 'e.g. 15 minutes before start' },
                { label: 'Parking', value: guideParking, set: setGuideParking, placeholder: 'e.g. Free street parking on Main St' },
                { label: 'Where to go', value: guideAccess, set: setGuideAccess, placeholder: 'e.g. Meet at the main gate' },
                { label: 'Your coach', value: guideRep, set: setGuideRep, placeholder: 'Coach name' },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>{f.label}</label>
                  <input
                    value={f.value}
                    onChange={e => f.set(e.target.value)}
                    placeholder={f.placeholder}
                    className={inputCls}
                    style={inputSty}
                  />
                </div>
              ))}
              <DialogFooter className="mt-2">
                <button onClick={() => setShowGuide(false)}
                  className="px-4 py-2 rounded-xl text-sm cursor-pointer hover:opacity-70"
                  style={{ color: 'var(--muted)' }}>
                  Cancel
                </button>
                <button onClick={handleSendGuide} disabled={isSendingGuide}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: '#FF6B4A' }}>
                  <Send className="w-3.5 h-3.5" />
                  {isSendingGuide ? 'Sending...' : 'Send Guide'}
                </button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}
