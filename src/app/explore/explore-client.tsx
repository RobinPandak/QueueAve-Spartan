'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Calendar, Users, ArrowRight, ClipboardList } from 'lucide-react'

type ExploreEvent = {
  id: string
  name: string
  date: string
  start_time: string | null
  venue: string | null
  description: string | null
  athletes: number
}

type Filter = 'today' | 'week' | 'weekend' | 'all'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'weekend', label: 'Weekend' },
  { key: 'all', label: 'All' },
]

function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function matchesFilter(eventDate: string, filter: Filter, today: string) {
  if (filter === 'all') return true
  if (filter === 'today') return eventDate === today
  if (filter === 'week') return eventDate <= addDays(today, 7)
  // weekend: upcoming Saturday and Sunday (or today if already the weekend)
  const day = new Date(`${today}T00:00:00`).getDay()
  const daysToSaturday = day === 0 ? -1 : 6 - day
  const saturday = addDays(today, daysToSaturday)
  const sunday = addDays(saturday, 1)
  return eventDate === saturday || eventDate === sunday || (day === 0 && eventDate === today)
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

export function ExploreClient({ events, today }: { events: ExploreEvent[]; today: string }) {
  const [filter, setFilter] = useState<Filter>('all')
  const filtered = events.filter(e => matchesFilter(e.date, filter, today))

  return (
    <div>
      {/* Filter pills */}
      <div className="flex gap-1.5 p-1 rounded-xl mb-6 max-w-sm" style={{ backgroundColor: 'var(--subtle)' }}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="flex-1 rounded-lg py-1.5 px-2 text-xs font-medium cursor-pointer transition-colors"
            style={filter === f.key
              ? { backgroundColor: '#FF6B4A', color: '#FFFFFF' }
              : { color: 'var(--muted)' }
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'rgba(255,107,74,0.12)' }}>
            <ClipboardList className="w-6 h-6 text-[#FF6B4A]" />
          </div>
          <p className="font-display font-bold" style={{ color: 'var(--fg)' }}>No open trainings right now</p>
          <p className="text-sm mt-1 mb-6" style={{ color: 'var(--muted)' }}>Check back soon, or set one up for your athletes.</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#FF6B4A' }}
          >
            Create an event
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map(event => (
            <Link key={event.id} href={`/join/${event.id}`}>
              <div
                className="group relative rounded-2xl p-6 border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg h-full"
                style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <h3 className="font-display font-bold text-lg tracking-tight" style={{ color: 'var(--fg)' }}>
                    {event.name}
                  </h3>
                  <span
                    className="shrink-0 text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-lg"
                    style={{ backgroundColor: 'rgba(0,191,165,0.12)', color: '#00896E' }}
                  >
                    Open
                  </span>
                </div>
                <div className="space-y-2.5 text-sm" style={{ color: 'var(--muted)' }}>
                  {event.venue && (
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 opacity-60" />
                      <span>{event.venue}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 opacity-60" />
                    <span>
                      {formatDate(event.date)}
                      {event.start_time ? ` at ${formatTime(event.start_time)}` : ''}
                    </span>
                  </div>
                </div>
                <div className="mt-5 pt-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted)' }}>
                    <Users className="w-3.5 h-3.5" />
                    <span className="font-mono font-medium">{event.athletes} {event.athletes === 1 ? 'athlete' : 'athletes'}</span>
                  </div>
                  <ArrowRight
                    className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 group-hover:text-[#FF6B4A] transition-all duration-200"
                    style={{ color: 'var(--muted)' }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
