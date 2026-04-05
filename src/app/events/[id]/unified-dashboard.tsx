'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Calendar, MapPin, Users, Copy, Check, Share2,
  Send, Play, UserPlus, UserMinus, Download, ChevronDown,
  TrendingUp, TrendingDown, Minus, Clock, SquareX,
  AlertTriangle, Zap, RefreshCw,
} from 'lucide-react'
import { TREND_COLOR } from '@/lib/progress'
import {
  toggleCheckIn, approveParticipant, rejectParticipant,
  addParticipantManually, removeParticipant,
  approveAllParticipants, sendEventGuide,
} from '@/app/actions/participants'
import { updateEventStatus } from '@/app/actions/events'
import { downloadParticipantsCsv } from '@/lib/export'
import { useRealtimeParticipants } from './use-realtime-participants'
import { HeatMap, type HeatCell, type TodayResult } from './progress/heat-map'
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
type ParticipantStat = { id: string; name: string; improving: number; declining: number; total: number }

type Props = {
  event: { id: string; name: string; status: string; date: string | null; venue: string | null; organizer_id: string }
  participants: Participant[]
  groups: Group[]
  metrics: { id: string; name: string; type: 'time' | 'count' | 'pass_fail' }[]
  cells: HeatCell[]
  todayResults: TodayResult[]
  participantStats: ParticipantStat[]
  mostImproved: ParticipantStat | null
  mostConsistent: ParticipantStat | null
  needsAttention: ParticipantStat | null
}

const STATUS_BADGE = {
  draft:       { label: 'Draft',       bg: 'rgba(255,184,0,.12)',  color: '#9B7800' },
  open:        { label: 'Open',        bg: 'rgba(0,191,165,.12)',  color: '#00896E', dot: '#00BFA5' },
  in_progress: { label: 'In Progress', bg: 'rgba(255,107,74,.12)', color: '#C44A2A', dot: '#FF6B4A' },
  completed:   { label: 'Completed',   bg: 'var(--subtle)',        color: 'var(--muted)' },
} as const

const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/30'
const inputSty = { backgroundColor: 'var(--subtle)', border: '1px solid var(--border)', color: 'var(--fg)' } as const

function formatDate(d: string | null) {
  if (!d) return null
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function Avatar({ name, small }: { name: string; small?: boolean }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const size = small ? 'w-7 h-7 text-[10px]' : 'w-8 h-8 text-xs'
  return (
    <div className={`${size} rounded-full flex items-center justify-center flex-shrink-0 font-bold`}
      style={{ backgroundColor: 'rgba(255,107,74,.12)', color: '#FF6B4A' }}>
      {initials}
    </div>
  )
}

export function UnifiedDashboard({ event, participants, groups, metrics, cells, todayResults, participantStats, mostImproved, mostConsistent, needsAttention }: Props) {
  const router = useRouter()
  const [, startAction] = useTransition()

  const [copied, setCopied] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [, startToggle] = useTransition()

  // Start / End event
  const [isStarting, setIsStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [isEnding, setIsEnding] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

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

  useRealtimeParticipants(event.id)

  const badge = STATUS_BADGE[event.status as keyof typeof STATUS_BADGE] ?? STATUS_BADGE.draft
  const isOpen = event.status === 'open'
  const isInProgress = event.status === 'in_progress'
  const isCompleted = event.status === 'completed'
  const approved = participants.filter(p => p.status === 'approved')
  const pending = participants.filter(p => !p.status || p.status === 'pending')
  const arrived = approved.filter(p => p.checked_in)
  const improvingCount = participantStats.filter(p => p.improving > p.declining).length
  const decliningCount = participantStats.filter(p => p.declining > 0).length

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
    } else { handleCopy() }
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

  const handleToggleCheckIn = (participantId: string, current: boolean) => {
    setTogglingId(participantId)
    startToggle(async () => {
      await toggleCheckIn(participantId, event.id, !current)
      router.refresh()
      setTogglingId(null)
    })
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => setIsRefreshing(false), 800)
  }

  const handleStartEvent = async () => {
    if (approved.length === 0) {
      setStartError('No approved athletes. Approve at least one athlete before starting.')
      return
    }
    setIsStarting(true)
    setStartError(null)
    const result = await updateEventStatus(event.id, 'in_progress')
    if ('error' in result) { setStartError(result.error); setIsStarting(false) }
    else { router.refresh(); setIsStarting(false) }
  }

  const handleEndEvent = async () => {
    setIsEnding(true)
    await updateEventStatus(event.id, 'completed')
    router.refresh()
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
    } catch { setAddError('Something went wrong.') }
    finally { setIsAdding(false) }
  }

  const handleRemove = async () => {
    if (!removeTarget) return
    setIsRemoving(true)
    try {
      await removeParticipant(removeTarget.id, event.id)
      setRemoveTarget(null)
      router.refresh()
    } finally { setIsRemoving(false) }
  }

  const handleSendGuide = async () => {
    setIsSendingGuide(true)
    try {
      const result = await sendEventGuide(event.id, { arrivalNote: guideArrival, parkingNote: guideParking, accessNote: guideAccess, repName: guideRep })
      setGuideSent(result)
    } finally { setIsSendingGuide(false) }
  }

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard" className="p-2.5 rounded-xl transition-colors hover:bg-[var(--subtle)] flex-shrink-0" style={{ color: 'var(--muted)' }}>
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold leading-tight truncate" style={{ color: 'var(--fg)' }}>{event.name}</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
                style={{ backgroundColor: badge.bg, color: badge.color }}>
                {'dot' in badge && badge.dot && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: badge.dot }} />}
                {badge.label}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              {event.date && (
                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted)' }}>
                  <Calendar className="w-3 h-3" />{formatDate(event.date)}
                </span>
              )}
              {event.venue && (
                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted)' }}>
                  <MapPin className="w-3 h-3 text-[#FF6B4A]" />{event.venue}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Header actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={handleRefresh} disabled={isRefreshing}
            className="p-2 rounded-xl cursor-pointer hover:opacity-70 transition-all disabled:opacity-40"
            style={{ color: 'var(--muted)', border: '1px solid var(--border)' }}
            title="Refresh">
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {isOpen && (
            <button onClick={handleStartEvent} disabled={isStarting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#FF6B4A' }}>
              <Play className="w-3.5 h-3.5" />{isStarting ? 'Starting...' : 'Start'}
            </button>
          )}

          {isInProgress && (
            <button onClick={() => setShowEndConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer hover:opacity-80"
              style={{ backgroundColor: 'rgba(229,72,77,.1)', color: '#E5484D', border: '1px solid rgba(229,72,77,.25)' }}>
              <SquareX className="w-3.5 h-3.5" /> End Event
            </button>
          )}
        </div>
      </div>

      {startError && <p className="text-xs px-3 py-2 rounded-xl" style={{ backgroundColor: 'rgba(229,72,77,.1)', color: '#E5484D' }}>{startError}</p>}

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Athletes', value: participants.length, color: '#FF6B4A' },
          { label: isInProgress ? 'Arrived' : 'Approved', value: isInProgress ? arrived.length : approved.length, color: '#00BFA5' },
          { label: 'Improving', value: improvingCount, color: '#00BFA5' },
          { label: 'Declining', value: decliningCount, color: '#E5484D' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-3 text-center" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>


      {/* ── Arrival progress bar (in_progress) ── */}
      {isInProgress && approved.length > 0 && (
        <div className="rounded-2xl px-4 py-3 space-y-2" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between text-xs" style={{ color: 'var(--muted)' }}>
            <span>Arrival progress</span>
            <span className="font-semibold" style={{ color: 'var(--fg)' }}>{Math.round((arrived.length / approved.length) * 100)}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--subtle)' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.round((arrived.length / approved.length) * 100)}%`, backgroundColor: '#00BFA5' }} />
          </div>
        </div>
      )}

      {/* ── Main 2-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Left: Athlete list ── */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--muted)' }}>
              <Users className="w-3.5 h-3.5" /> Athletes
              <span className="px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: 'var(--subtle)', color: 'var(--muted)' }}>
                {participants.length}
              </span>
              {pending.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: 'rgba(255,184,0,.15)', color: '#9B7800' }}>
                  {pending.length} pending
                </span>
              )}
            </h2>
            {!isCompleted && (
              <div className="flex items-center gap-1.5">
                {pending.length > 0 && (
                  <button onClick={handleApproveAll}
                    className="text-xs font-medium px-2 py-1 rounded-lg cursor-pointer hover:opacity-80"
                    style={{ backgroundColor: 'rgba(0,191,165,.1)', color: '#00896E' }}>
                    Approve all
                  </button>
                )}
                <button onClick={() => { setShowAddPlayer(true); setAddError(null) }}
                  className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg cursor-pointer hover:opacity-80"
                  style={{ backgroundColor: 'rgba(255,107,74,.1)', color: '#FF6B4A' }}>
                  <UserPlus className="w-3 h-3" /> Add
                </button>
              </div>
            )}
          </div>

          {participants.length === 0 ? (
            <div className="text-center py-8 rounded-2xl border" style={{ borderColor: 'var(--border)', borderStyle: 'dashed' }}>
              <Users className="w-7 h-7 mx-auto mb-2" style={{ color: 'rgba(107,107,107,.3)' }} />
              <p className="text-xs" style={{ color: 'var(--muted)' }}>No athletes yet</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-0.5">
              {participants.map(p => {
                const isPending = !p.status || p.status === 'pending'
                const isApproved = p.status === 'approved'
                const stat = participantStats.find(s => s.id === p.id)
                const overallTrend = stat && stat.total > 0
                  ? stat.improving > stat.declining ? 'improving'
                  : stat.declining > stat.improving ? 'declining' : 'flat'
                  : 'none'
                const TrendIcon = overallTrend === 'improving' ? TrendingUp : overallTrend === 'declining' ? TrendingDown : Minus
                const trendColor = overallTrend !== 'none' ? TREND_COLOR[overallTrend as keyof typeof TREND_COLOR] : 'var(--muted)'

                return (
                  <div key={p.id}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border"
                    style={{ backgroundColor: 'var(--card)', borderColor: isPending ? 'rgba(255,184,0,.3)' : 'var(--border)' }}>
                    <Avatar name={p.name} small />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--fg)' }}>{p.name}</p>
                      <div className="flex items-center gap-1">
                        {overallTrend !== 'none' && <TrendIcon className="w-3 h-3 flex-shrink-0" style={{ color: trendColor }} />}
                        <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>
                          {isPending ? 'Pending' : (isInProgress || isOpen) ? (p.checked_in ? 'Arrived' : 'Not arrived') : isApproved ? 'Approved' : 'Rejected'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!isCompleted && isPending ? (
                        <>
                          <button onClick={() => handleApprove(p.id)} disabled={actionId === p.id}
                            className="px-2 py-1 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
                            style={{ backgroundColor: 'rgba(0,191,165,.12)', color: '#00896E' }}>
                            <Check className="w-3 h-3" />
                          </button>
                          <button onClick={() => handleReject(p.id)} disabled={actionId === p.id}
                            className="px-2 py-1 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
                            style={{ backgroundColor: 'rgba(229,72,77,.1)', color: '#E5484D' }}>
                            <SquareX className="w-3 h-3" />
                          </button>
                        </>
                      ) : !isCompleted && (isInProgress || isOpen) && isApproved ? (
                        <button onClick={() => handleToggleCheckIn(p.id, p.checked_in)} disabled={togglingId === p.id}
                          className="px-2 py-1 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-40"
                          style={p.checked_in
                            ? { backgroundColor: 'rgba(0,191,165,.1)', color: '#00896E' }
                            : { backgroundColor: 'var(--subtle)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
                          {p.checked_in ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        </button>
                      ) : null}
                      <button onClick={() => setRemoveTarget(p)}
                        className="p-1 rounded-lg cursor-pointer hover:opacity-70" style={{ color: 'var(--muted)' }}>
                        <UserMinus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Right: Summary cards + Heat map ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Summary cards */}
          {participantStats.some(p => p.total > 0) && (
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl p-4 space-y-2" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(0,191,165,.12)' }}>
                  <TrendingUp className="w-4 h-4" style={{ color: '#00BFA5' }} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--muted)' }}>Most Improved</p>
                  {mostImproved ? (
                    <>
                      <p className="text-sm font-bold" style={{ color: 'var(--fg)' }}>{mostImproved.name}</p>
                      <p className="text-xs" style={{ color: '#00896E' }}>{mostImproved.improving} metric{mostImproved.improving !== 1 ? 's' : ''} improving</p>
                    </>
                  ) : <p className="text-xs" style={{ color: 'var(--muted)' }}>Not enough data</p>}
                </div>
              </div>

              <div className="rounded-2xl p-4 space-y-2" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,184,0,.12)' }}>
                  <Zap className="w-4 h-4" style={{ color: '#FFB800' }} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--muted)' }}>Most Consistent</p>
                  {mostConsistent ? (
                    <>
                      <p className="text-sm font-bold" style={{ color: 'var(--fg)' }}>{mostConsistent.name}</p>
                      <p className="text-xs" style={{ color: '#9B7800' }}>{mostConsistent.total - mostConsistent.declining} of {mostConsistent.total} on track</p>
                    </>
                  ) : <p className="text-xs" style={{ color: 'var(--muted)' }}>Not enough data</p>}
                </div>
              </div>

              <div className="rounded-2xl p-4 space-y-2" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(229,72,77,.1)' }}>
                  <AlertTriangle className="w-4 h-4" style={{ color: '#E5484D' }} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--muted)' }}>Needs Attention</p>
                  {needsAttention ? (
                    <>
                      <p className="text-sm font-bold" style={{ color: 'var(--fg)' }}>{needsAttention.name}</p>
                      <p className="text-xs" style={{ color: '#E5484D' }}>{needsAttention.declining} metric{needsAttention.declining !== 1 ? 's' : ''} declining</p>
                    </>
                  ) : <p className="text-xs" style={{ color: '#00896E' }}>Everyone on track</p>}
                </div>
              </div>
            </div>
          )}

          {/* Heat map */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>
              Athlete Progress
            </h3>
            {metrics.length === 0 || approved.length === 0 ? (
              <div className="text-center py-10 rounded-2xl border" style={{ borderColor: 'var(--border)', borderStyle: 'dashed' }}>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>No session data yet. Record a session to see progress.</p>
              </div>
            ) : (
              <HeatMap
                eventId={event.id}
                participants={approved.map(p => ({ id: p.id, name: p.name, checkedIn: p.checked_in }))}
                metrics={metrics}
                cells={cells}
                todayResults={todayResults}
                allowResults={isInProgress}
              />
            )}
            {metrics.length > 0 && approved.length > 0 && (
              <div className="flex items-center gap-4 mt-3 px-1">
                {[
                  { color: TREND_COLOR.improving, label: 'Improving' },
                  { color: TREND_COLOR.flat, label: 'No change' },
                  { color: TREND_COLOR.declining, label: 'Declining' },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: `${l.color}40` }} />
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>{l.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Add Player Dialog ── */}
      <Dialog open={showAddPlayer} onOpenChange={v => { setShowAddPlayer(v); setAddError(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Athlete</DialogTitle></DialogHeader>
          <form onSubmit={handleAddPlayer} className="space-y-3 mt-2">
            <input required placeholder="Full name" value={addName} onChange={e => setAddName(e.target.value)} className={inputCls} style={inputSty} />
            <input type="email" placeholder="Email (optional)" value={addEmail} onChange={e => setAddEmail(e.target.value)} className={inputCls} style={inputSty} />
            {groups.length > 0 && (
              <select value={addGroupId} onChange={e => setAddGroupId(e.target.value)} className={`${inputCls} cursor-pointer`} style={inputSty}>
                <option value="">No group</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            )}
            {addError && <p className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(229,72,77,.1)', color: '#E5484D' }}>{addError}</p>}
            <DialogFooter>
              <button type="button" onClick={() => setShowAddPlayer(false)} className="px-4 py-2 rounded-xl text-sm cursor-pointer hover:opacity-70" style={{ color: 'var(--muted)' }}>Cancel</button>
              <button type="submit" disabled={isAdding} className="px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer disabled:opacity-50" style={{ backgroundColor: '#FF6B4A' }}>
                {isAdding ? 'Adding...' : 'Add Athlete'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Remove Confirmation Dialog ── */}
      <Dialog open={!!removeTarget} onOpenChange={v => !v && setRemoveTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Remove Athlete</DialogTitle></DialogHeader>
          <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>
            Remove <strong style={{ color: 'var(--fg)' }}>{removeTarget?.name}</strong> from this event? This cannot be undone.
          </p>
          <DialogFooter className="mt-4">
            <button onClick={() => setRemoveTarget(null)} className="px-4 py-2 rounded-xl text-sm cursor-pointer hover:opacity-70" style={{ color: 'var(--muted)' }}>Cancel</button>
            <button onClick={handleRemove} disabled={isRemoving} className="px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer disabled:opacity-50" style={{ backgroundColor: '#E5484D' }}>
              {isRemoving ? 'Removing...' : 'Remove'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Send Guide Dialog ── */}
      <Dialog open={showGuide} onOpenChange={v => { setShowGuide(v); setGuideSent(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send Event Guide</DialogTitle></DialogHeader>
          {guideSent ? (
            <div className="text-center py-6 space-y-2">
              <p className="text-2xl">✓</p>
              <p className="font-semibold" style={{ color: 'var(--fg)' }}>Guide sent!</p>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>{guideSent.sent} sent, {guideSent.skipped} skipped (no email)</p>
              <button onClick={() => setShowGuide(false)} className="mt-3 px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer" style={{ backgroundColor: '#FF6B4A' }}>Done</button>
            </div>
          ) : (
            <div className="space-y-3 mt-2">
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Sends to all approved athletes with an email address.</p>
              {[
                { label: 'Arrive', value: guideArrival, set: setGuideArrival, placeholder: 'e.g. 15 minutes before start' },
                { label: 'Parking', value: guideParking, set: setGuideParking, placeholder: 'e.g. Free street parking on Main St' },
                { label: 'Where to go', value: guideAccess, set: setGuideAccess, placeholder: 'e.g. Meet at the main gate' },
                { label: 'Your coach', value: guideRep, set: setGuideRep, placeholder: 'Coach name' },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>{f.label}</label>
                  <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} className={inputCls} style={inputSty} />
                </div>
              ))}
              <DialogFooter className="mt-2">
                <button onClick={() => setShowGuide(false)} className="px-4 py-2 rounded-xl text-sm cursor-pointer hover:opacity-70" style={{ color: 'var(--muted)' }}>Cancel</button>
                <button onClick={handleSendGuide} disabled={isSendingGuide}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer disabled:opacity-50" style={{ backgroundColor: '#FF6B4A' }}>
                  <Send className="w-3.5 h-3.5" />{isSendingGuide ? 'Sending...' : 'Send Guide'}
                </button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── End Event Dialog ── */}
      <Dialog open={showEndConfirm} onOpenChange={setShowEndConfirm}>
        <DialogContent>
          <DialogHeader><DialogTitle>End Event</DialogTitle></DialogHeader>
          <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>
            This will mark <strong style={{ color: 'var(--fg)' }}>{event.name}</strong> as completed. You can still view sessions and progress after.
          </p>
          <DialogFooter className="mt-4">
            <button onClick={() => setShowEndConfirm(false)} className="px-4 py-2 rounded-xl text-sm cursor-pointer hover:opacity-70" style={{ color: 'var(--muted)' }}>Cancel</button>
            <button onClick={handleEndEvent} disabled={isEnding} className="px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer disabled:opacity-50" style={{ backgroundColor: '#E5484D' }}>
              {isEnding ? 'Ending...' : 'End Event'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
