'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Calendar, MapPin, Users, Search, X, Share2 } from 'lucide-react'

export type EventCard = {
  id: string
  name: string
  date: string | null
  venue: string | null
  status: 'draft' | 'open' | 'completed'
  participant_count: number
}

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'past', label: 'Past' },
] as const

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'No date set'
  const date = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'
  if (diffDays > 1 && diffDays <= 6) return date.toLocaleDateString('en-US', { weekday: 'long' })
  if (diffDays < -1 && diffDays >= -6) return `${Math.abs(diffDays)} days ago`
  return date.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
    ...(date.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
  })
}

export function EventsList({ events, coachName }: { events: EventCard[]; coachName: string }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = coachName?.split(' ')[0] ?? ''
  const title = firstName ? `${greeting}, ${firstName}` : 'My Events'

  const activeCount = events.filter(e => e.status === 'open').length
  const totalParticipants = events.reduce((sum, e) => sum + e.participant_count, 0)

  const filtered = useMemo(() => {
    let result = events
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(e => e.name.toLowerCase().includes(q))
    }
    if (filter === 'active') result = result.filter(e => e.status === 'open')
    else if (filter === 'draft') result = result.filter(e => e.status === 'draft')
    else if (filter === 'past') result = result.filter(e => e.status === 'completed')
    return result
  }, [events, search, filter])

  const activeEvents = filtered.filter(e => e.status === 'open')
  const pastEvents = filtered.filter(e => e.status !== 'open')
  const showSearch = events.length >= 5

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--fg)' }}>{title}</h1>
          {events.length > 0 && (
            <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
              <span style={{ color: '#FF6B4A', fontWeight: 600 }}>{activeCount} active</span>
              {' · '}{events.length} events{' · '}{totalParticipants} participants
            </p>
          )}
        </div>
        <Link
          href="/events/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97]"
          style={{ backgroundColor: '#FF6B4A', boxShadow: '0 4px 14px rgba(255,107,74,.25)' }}
        >
          + New Event
        </Link>
      </div>

      {events.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {showSearch && (
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--muted)' }} />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full h-10 rounded-xl pl-9 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/40"
                  style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--fg)' }}
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" style={{ color: 'var(--muted)' }}>
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex gap-1 rounded-xl p-1" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                {STATUS_FILTERS.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
                    style={filter === f.value ? { backgroundColor: '#FF6B4A', color: 'white' } : { color: 'var(--muted)' }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(107,107,107,.3)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
                {search ? `No events matching "${search}"` : 'No events in this category'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {activeEvents.length > 0 && (
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00BFA5] animate-pulse inline-block" />
                    Active
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {activeEvents.map((e, i) => <ActiveCard key={e.id} event={e} delay={i * 60} />)}
                  </div>
                </div>
              )}
              {pastEvents.length > 0 && (
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>Past</h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {pastEvents.map((e, i) => <PastCard key={e.id} event={e} delay={(i + activeEvents.length) * 60} />)}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ActiveCard({ event: e, delay }: { event: EventCard; delay: number }) {
  const handleShare = async (evt: React.MouseEvent) => {
    evt.preventDefault()
    evt.stopPropagation()
    const url = `${window.location.origin}/join/${e.id}`
    if (navigator.share) {
      try { await navigator.share({ title: e.name, text: `Join ${e.name} on Spartan`, url }) } catch { /* cancelled */ }
    } else {
      try { await navigator.clipboard.writeText(url) } catch { window.prompt('Copy this link:', url) }
    }
  }

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      <div
        className="border border-l-4 rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderLeftColor: '#FF6B4A' }}
      >
        <Link href={`/events/${e.id}`} className="block p-5">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-base font-semibold truncate mr-2 group-hover:text-[#FF6B4A] transition-colors" style={{ color: 'var(--fg)' }}>
              {e.name}
            </h3>
            <span className="flex-shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(0,191,165,.12)', color: '#00896E' }}>
              open
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm" style={{ color: 'var(--muted)' }}>
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(e.date)}</span>
            {e.venue && <><span>·</span><span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{e.venue}</span></>}
            <span>·</span>
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{e.participant_count}</span>
          </div>
        </Link>
        <button
          onClick={handleShare}
          className="w-full border-t flex items-center justify-center gap-1.5 text-sm py-2.5 transition-all hover:opacity-70 cursor-pointer"
          style={{ borderColor: 'var(--border)', color: '#FF6B4A' }}
        >
          <Share2 className="w-3.5 h-3.5" /> Share join link
        </button>
      </div>
    </div>
  )
}

function PastCard({ event: e, delay }: { event: EventCard; delay: number }) {
  const badge =
    e.status === 'draft'
      ? { bg: 'rgba(255,184,0,.12)', color: '#9B7800' }
      : { bg: 'var(--subtle)', color: 'var(--muted)' }

  return (
    <Link href={`/events/${e.id}`} className="animate-fade-in-up block" style={{ animationDelay: `${delay}ms` }}>
      <div
        className="rounded-2xl p-4 transition-all duration-200 group cursor-pointer hover:shadow-sm"
        style={{ backgroundColor: 'rgba(255,255,255,.6)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-sm font-medium truncate mr-2 group-hover:text-[#FF6B4A] transition-colors" style={{ color: 'var(--muted)' }}>
            {e.name}
          </h3>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: badge.bg, color: badge.color }}>
            {e.status}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-2 text-xs" style={{ color: 'var(--muted)' }}>
          <span>{formatDate(e.date)}</span>
          {e.participant_count > 0 && <><span>·</span><span>{e.participant_count} participants</span></>}
        </div>
      </div>
    </Link>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <p className="text-lg font-display font-bold mb-2" style={{ color: 'var(--fg)' }}>No events yet</p>
      <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>Create your first event to get started.</p>
      <Link
        href="/events/new"
        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold text-sm text-white transition-all hover:opacity-90"
        style={{ backgroundColor: '#FF6B4A', boxShadow: '0 4px 14px rgba(255,107,74,.25)' }}
      >
        Create your first event
      </Link>
    </div>
  )
}
