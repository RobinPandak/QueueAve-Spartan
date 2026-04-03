'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, Clock, Users, ClipboardList, BarChart2, Square } from 'lucide-react'
import { toggleCheckIn } from '@/app/actions/participants'
import { updateEventStatus } from '@/app/actions/events'
import { useRealtimeParticipants } from './use-realtime-participants'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

type Participant = {
  id: string
  name: string
  checked_in: boolean
  group_id: string | null
  status: string | null
}
type Group = { id: string; name: string }
type Props = {
  event: { id: string; name: string; date: string | null; venue: string | null }
  participants: Participant[]
  groups: Group[]
  sessionCount: number
}

function Avatar({ name, small }: { name: string; small?: boolean }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const size = small ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs'
  return (
    <div className={`${size} rounded-full flex items-center justify-center flex-shrink-0 font-bold`}
      style={{ backgroundColor: 'rgba(255,107,74,.12)', color: '#FF6B4A' }}>
      {initials}
    </div>
  )
}

export function LiveView({ event, participants, groups, sessionCount }: Props) {
  const router = useRouter()
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [, startToggle] = useTransition()
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [isEnding, setIsEnding] = useState(false)

  useRealtimeParticipants(event.id)

  const approved = participants.filter(p => p.status === 'approved')
  const arrived = approved.filter(p => p.checked_in)
  const notArrived = approved.filter(p => !p.checked_in)
  const fillPct = approved.length ? Math.round((arrived.length / approved.length) * 100) : 0

  const handleToggle = (participantId: string, current: boolean) => {
    setTogglingId(participantId)
    startToggle(async () => {
      await toggleCheckIn(participantId, event.id, !current)
      router.refresh()
      setTogglingId(null)
    })
  }

  const handleEndEvent = async () => {
    setIsEnding(true)
    await updateEventStatus(event.id, 'completed')
    router.refresh()
  }

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm mb-2 hover:opacity-70 transition-opacity" style={{ color: 'var(--muted)' }}>
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </Link>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold" style={{ color: 'var(--fg)' }}>
              {event.name}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: 'rgba(255,107,74,.12)', color: '#C44A2A' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#FF6B4A' }} />
              In Progress
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowEndConfirm(true)}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all hover:opacity-80"
          style={{ backgroundColor: 'rgba(229,72,77,.1)', color: '#E5484D', border: '1px solid rgba(229,72,77,.2)' }}
        >
          <Square className="w-3.5 h-3.5" /> End Event
        </button>
      </div>

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl p-4 text-center" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
          <p className="text-2xl font-black" style={{ color: '#FF6B4A' }}>{approved.length}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Total</p>
        </div>
        <div className="rounded-2xl p-4 text-center" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
          <p className="text-2xl font-black" style={{ color: '#00BFA5' }}>{arrived.length}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Arrived</p>
        </div>
        <div className="rounded-2xl p-4 text-center" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
          <p className="text-2xl font-black" style={{ color: '#FFB800' }}>{notArrived.length}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Pending</p>
        </div>
      </div>

      {/* ── Arrival progress bar ── */}
      {approved.length > 0 && (
        <div className="rounded-2xl p-4 space-y-2" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between text-xs" style={{ color: 'var(--muted)' }}>
            <span>Arrival progress</span>
            <span className="font-semibold" style={{ color: 'var(--fg)' }}>{fillPct}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--subtle)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${fillPct}%`, backgroundColor: '#00BFA5' }}
            />
          </div>
        </div>
      )}

      {/* ── Quick actions ── */}
      <div className="grid grid-cols-2 gap-3">
        <Link href={`/events/${event.id}/sessions/new`}
          className="flex items-center gap-3 p-4 rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-sm"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255,107,74,.1)', color: '#FF6B4A' }}>
            <ClipboardList className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>Record Session</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>{sessionCount} recorded</p>
          </div>
        </Link>

        <Link href={`/events/${event.id}/progress`}
          className="flex items-center gap-3 p-4 rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-sm"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255,184,0,.1)', color: '#FFB800' }}>
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>Progress</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Charts and trends</p>
          </div>
        </Link>
      </div>

      {/* ── Not arrived ── */}
      {notArrived.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--muted)' }}>
            <Clock className="w-3.5 h-3.5" /> Not yet arrived
            <span className="px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: 'rgba(255,184,0,.15)', color: '#9B7800' }}>
              {notArrived.length}
            </span>
          </h2>
          <div className="space-y-2">
            {notArrived.map(p => {
              const group = groups.find(g => g.id === p.group_id)
              return (
                <div key={p.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
                  style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                  <Avatar name={p.name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--fg)' }}>{p.name}</p>
                    {group && <p className="text-xs" style={{ color: 'var(--muted)' }}>{group.name}</p>}
                  </div>
                  <button
                    onClick={() => handleToggle(p.id, false)}
                    disabled={togglingId === p.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all hover:opacity-80 disabled:opacity-40"
                    style={{ backgroundColor: 'var(--subtle)', color: 'var(--muted)', border: '1px solid var(--border)' }}
                  >
                    <Check className="w-3.5 h-3.5" /> Check in
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Arrived ── */}
      {arrived.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--muted)' }}>
            <Check className="w-3.5 h-3.5" style={{ color: '#00BFA5' }} /> Arrived
            <span className="px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: 'rgba(0,191,165,.12)', color: '#00896E' }}>
              {arrived.length}
            </span>
          </h2>
          <div className="space-y-2">
            {arrived.map(p => {
              const group = groups.find(g => g.id === p.group_id)
              return (
                <div key={p.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
                  style={{ backgroundColor: 'var(--card)', borderColor: 'rgba(0,191,165,.2)' }}>
                  <Avatar name={p.name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--fg)' }}>{p.name}</p>
                    {group && <p className="text-xs" style={{ color: 'var(--muted)' }}>{group.name}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold"
                      style={{ backgroundColor: 'rgba(0,191,165,.1)', color: '#00896E' }}>
                      <Check className="w-3 h-3" /> In
                    </span>
                    <button
                      onClick={() => handleToggle(p.id, true)}
                      disabled={togglingId === p.id}
                      className="text-xs cursor-pointer hover:opacity-60 transition-opacity disabled:opacity-30"
                      style={{ color: 'var(--muted)' }}
                      title="Undo check-in"
                    >
                      Undo
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {approved.length === 0 && (
        <div className="text-center py-10 rounded-2xl border" style={{ borderColor: 'var(--border)', borderStyle: 'dashed' }}>
          <Users className="w-8 h-8 mx-auto mb-2" style={{ color: 'rgba(107,107,107,.3)' }} />
          <p className="text-sm" style={{ color: 'var(--muted)' }}>No approved athletes yet.</p>
        </div>
      )}

      {/* ── End Event Confirmation ── */}
      <Dialog open={showEndConfirm} onOpenChange={setShowEndConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Event</DialogTitle>
          </DialogHeader>
          <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>
            This will mark <strong style={{ color: 'var(--fg)' }}>{event.name}</strong> as completed. You can still view sessions and progress after.
          </p>
          <DialogFooter className="mt-4">
            <button onClick={() => setShowEndConfirm(false)}
              className="px-4 py-2 rounded-xl text-sm cursor-pointer hover:opacity-70"
              style={{ color: 'var(--muted)' }}>
              Cancel
            </button>
            <button onClick={handleEndEvent} disabled={isEnding}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: '#E5484D' }}>
              {isEnding ? 'Ending...' : 'End Event'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
