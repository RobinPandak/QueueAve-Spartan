# Dashboard + Event Creation Wizard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Spartan's plain event list dashboard and 3-step wizard with badminton-style card grid UI and a 4-step animated wizard, keeping all server actions and data unchanged.

**Architecture:** Two independent UI rewrites — (1) dashboard page becomes a server component that fetches participant counts + organizer name then passes to a new `EventsList` client component; (2) `EventWizard` gets a new shell with thin progress bars, conversational headings, and a `SlideIn` wrapper for step transitions.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Supabase client

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/components/slide-in.tsx` | CSS keyframe animation wrapper for wizard step transitions |
| Modify | `src/app/globals.css` | Add `slide-in-left` / `slide-in-right` keyframes |
| Create | `src/app/dashboard/events-list.tsx` | `EventsList`, `ActiveCard`, `PastCard`, `formatDate` — all client-side |
| Modify | `src/app/dashboard/page.tsx` | Fetch organizer name + participant counts, render `EventsList` |
| Modify | `src/app/events/new/wizard.tsx` | Full UI rewrite — 4-step wizard with new shell, all state/handlers preserved |

---

## Task 1: SlideIn Component + CSS Keyframes

**Files:**
- Create: `src/components/slide-in.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add keyframes to `src/app/globals.css`**

Append after the existing `@keyframes pop-in` block:

```css
@keyframes slide-in-right {
  from { opacity: 0; transform: translateX(20px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes slide-in-left {
  from { opacity: 0; transform: translateX(-20px); }
  to   { opacity: 1; transform: translateX(0); }
}
```

- [ ] **Step 2: Create `src/components/slide-in.tsx`**

```tsx
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
```

- [ ] **Step 3: Verify the component compiles**

```bash
cd /c/Users/joroc/desktop/spartan && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors referencing `slide-in.tsx`.

- [ ] **Step 4: Commit**

```bash
git add src/components/slide-in.tsx src/app/globals.css
git commit -m "feat: add SlideIn component and slide keyframes

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
git push origin main
```

---

## Task 2: EventsList Client Component

**Files:**
- Create: `src/app/dashboard/events-list.tsx`

- [ ] **Step 1: Create `src/app/dashboard/events-list.tsx`**

```tsx
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /c/Users/joroc/desktop/spartan && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors referencing `events-list.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/events-list.tsx
git commit -m "feat: add EventsList client component with Active/Past grid

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
git push origin main
```

---

## Task 3: Update Dashboard Page

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Replace `src/app/dashboard/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EventsList, type EventCard } from './events-list'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: organizer }, { data: events }] = await Promise.all([
    supabase.from('organizers').select('name').eq('id', user.id).single(),
    supabase
      .from('spartan_events')
      .select('id, name, date, venue, status')
      .eq('organizer_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const eventIds = (events ?? []).map(e => e.id)
  const participantCounts: Record<string, number> = {}
  if (eventIds.length > 0) {
    const { data: counts } = await supabase
      .from('spartan_participants')
      .select('event_id')
      .in('event_id', eventIds)
    for (const row of counts ?? []) {
      participantCounts[row.event_id] = (participantCounts[row.event_id] ?? 0) + 1
    }
  }

  const eventCards: EventCard[] = (events ?? []).map(e => ({
    id: e.id,
    name: e.name,
    date: e.date,
    venue: e.venue,
    status: e.status as 'draft' | 'open' | 'completed',
    participant_count: participantCounts[e.id] ?? 0,
  }))

  return <EventsList events={eventCards} coachName={organizer?.name ?? ''} />
}
```

- [ ] **Step 2: Run the dev server and verify visually**

```bash
cd /c/Users/joroc/desktop/spartan && npm run dev
```

Open http://localhost:3000/dashboard. Verify:
- Greeting shows "Good morning/afternoon/evening, [first name]" (or "My Events" if no name set)
- Stats row: "X active · Y events · Z participants"
- Open events appear in "Active" section with coral left border + Share button
- Completed/draft events appear in "Past" section with muted styling
- Search input visible if 5+ events, hidden if fewer
- Filter tabs work (All / Active / Draft / Past)
- Clicking a card navigates to `/events/[id]`

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: redesign dashboard with greeting, stats, Active/Past card grid

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
git push origin main
```

---

## Task 4: Rewrite Event Creation Wizard

**Files:**
- Modify: `src/app/events/new/wizard.tsx`

- [ ] **Step 1: Replace `src/app/events/new/wizard.tsx`**

```tsx
'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react'
import { createEvent } from '@/app/actions/events'
import SlideIn from '@/components/slide-in'

type Step = 1 | 2 | 3 | 4
type Group = { name: string; start_time?: string }
type Metric = { name: string; type: 'time' | 'count' | 'pass_fail'; unit?: string }
type Template = { name: string; metrics: Metric[] }

const STEP_LABELS: Record<number, string> = {
  1: 'The basics',
  2: 'When & where',
  3: 'Training groups',
  4: 'Templates & metrics',
}

const STEP_HEADINGS: Record<number, string> = {
  1: "What's your event called?",
  2: 'When is it happening?',
  3: "Who's training?",
  4: 'What are you measuring?',
}

const NAME_SUGGESTIONS = ['Spartan Sprint', 'Obstacle Trial', 'Team Qualifier', 'Pre-season Camp']

const METRIC_CHIPS: Record<string, { bg: string; color: string }> = {
  time:      { bg: 'rgba(0,191,165,.12)',   color: '#00896E' },
  count:     { bg: 'rgba(255,184,0,.12)',   color: '#9B7800' },
  pass_fail: { bg: 'var(--subtle)',          color: 'var(--muted)' },
}

const inputCls = "w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/40"
const inputSty = { backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--fg)' } as const
const labelCls = "block text-xs font-bold uppercase tracking-wider mb-2"
const labelSty = { color: 'var(--fg)' } as const

export function EventWizard() {
  const [step, setStep] = useState<Step>(1)
  const [slideDir, setSlideDir] = useState<'left' | 'right'>('right')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const nameRef = useRef<HTMLInputElement>(null)

  const [name, setName]            = useState('')
  const [date, setDate]            = useState('')
  const [venue, setVenue]          = useState('')
  const [description, setDescription] = useState('')
  const [groups, setGroups]        = useState<Group[]>([{ name: '' }])
  const [templates, setTemplates]  = useState<Template[]>([{ name: '', metrics: [{ name: '', type: 'time' }] }])

  useEffect(() => { if (step === 1) nameRef.current?.focus() }, [step])

  function goNext() {
    const e: Record<string, string> = {}
    if (step === 1 && !name.trim()) e.name = 'Event name is required'
    if (step === 2 && !date) e.date = 'Date is required'
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({})
    setSlideDir('right')
    setStep(s => Math.min(s + 1, 4) as Step)
  }

  function goBack() {
    setErrors({})
    setSlideDir('left')
    setStep(s => Math.max(s - 1, 1) as Step)
  }

  const addGroup     = () => setGroups(g => [...g, { name: '' }])
  const removeGroup  = (i: number) => setGroups(g => g.filter((_, idx) => idx !== i))
  const updateGroup  = (i: number, field: keyof Group, val: string) =>
    setGroups(g => g.map((gr, idx) => idx === i ? { ...gr, [field]: val } : gr))

  const addTemplate        = () => setTemplates(t => [...t, { name: '', metrics: [{ name: '', type: 'time' }] }])
  const removeTemplate     = (ti: number) => setTemplates(t => t.filter((_, i) => i !== ti))
  const updateTemplateName = (ti: number, val: string) =>
    setTemplates(t => t.map((tmpl, i) => i === ti ? { ...tmpl, name: val } : tmpl))
  const addMetric    = (ti: number) =>
    setTemplates(t => t.map((tmpl, i) => i === ti ? { ...tmpl, metrics: [...tmpl.metrics, { name: '', type: 'time' }] } : tmpl))
  const removeMetric = (ti: number, mi: number) =>
    setTemplates(t => t.map((tmpl, i) => i === ti ? { ...tmpl, metrics: tmpl.metrics.filter((_, j) => j !== mi) } : tmpl))
  const updateMetric = (ti: number, mi: number, field: keyof Metric, val: string) =>
    setTemplates(t => t.map((tmpl, i) => i === ti
      ? { ...tmpl, metrics: tmpl.metrics.map((m, j) => j === mi ? { ...m, [field]: val } : m) }
      : tmpl))

  async function handleSubmit() {
    if (!templates.some(t => t.name.trim())) {
      setErrors({ templates: 'Add at least one template name' })
      return
    }
    setSaving(true)
    await createEvent({
      name, date, venue, description,
      groups: groups.filter(g => g.name.trim()),
      templates: templates.filter(t => t.name.trim()),
    })
  }

  return (
    <div>
      {/* Progress bars */}
      <div className="flex items-center gap-2 mb-2">
        {([1, 2, 3, 4] as const).map(s => (
          <button
            key={s}
            type="button"
            onClick={() => { if (s < step) { setErrors({}); setSlideDir('left'); setStep(s) } }}
            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
              s < step ? 'bg-[#FF6B4A] cursor-pointer'
                       : s === step ? 'bg-[#FF6B4A]/40'
                       : 'cursor-default'
            }`}
            style={s >= step ? { backgroundColor: 'var(--border)' } : {}}
            title={STEP_LABELS[s]}
          />
        ))}
      </div>

      {/* Step label */}
      <p className="text-xs mb-8" style={{ color: 'var(--muted)' }}>
        Step {step} of 4,&nbsp;{STEP_LABELS[step]}
      </p>

      {/* Animated step content */}
      <SlideIn key={step} direction={slideDir}>
        <div className="space-y-6">
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold" style={{ color: 'var(--fg)' }}>
            {STEP_HEADINGS[step]}
          </h2>

          {/* ── Step 1: The basics ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <input
                  ref={nameRef}
                  className="w-full px-4 py-3 rounded-xl border text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/40"
                  style={{ ...inputSty, borderColor: name.trim() && !errors.name ? '#FF6B4A' : 'var(--border)' }}
                  value={name}
                  onChange={e => { setName(e.target.value); setErrors({}) }}
                  placeholder="e.g. Spartan Sprint #5"
                />
                {errors.name && <p className="text-xs mt-1.5" style={{ color: '#E5484D' }}>{errors.name}</p>}
                {name.trim() && !errors.name && (
                  <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: '#00BFA5' }}>
                    <Check className="w-3.5 h-3.5" /> Great name!
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: 'var(--muted)' }}>Need ideas?</p>
                <div className="flex flex-wrap gap-2">
                  {NAME_SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => { setName(s); setErrors({}) }}
                      className="px-3.5 py-2 text-sm rounded-xl border transition-all cursor-pointer hover:border-[#FF6B4A]"
                      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--muted)' }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: When & where ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className={labelCls} style={labelSty}>Date</label>
                <input
                  type="date"
                  className={inputCls}
                  style={inputSty}
                  value={date}
                  onChange={e => { setDate(e.target.value); setErrors({}) }}
                />
                {errors.date && <p className="text-xs mt-1.5" style={{ color: '#E5484D' }}>{errors.date}</p>}
              </div>
              <div>
                <label className={labelCls} style={labelSty}>
                  Venue{' '}
                  <span className="text-xs font-normal normal-case tracking-normal" style={{ color: 'var(--muted)' }}>optional</span>
                </label>
                <input className={inputCls} style={inputSty} value={venue} onChange={e => setVenue(e.target.value)} placeholder="e.g. Spartan Training Ground" />
              </div>
              <div>
                <label className={labelCls} style={labelSty}>
                  Description{' '}
                  <span className="text-xs font-normal normal-case tracking-normal" style={{ color: 'var(--muted)' }}>optional</span>
                </label>
                <textarea className={inputCls} style={inputSty} rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of the training program" />
              </div>
            </div>
          )}

          {/* ── Step 3: Training groups ── */}
          {step === 3 && (
            <div className="space-y-3">
              {groups.map((g, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className={inputCls}
                    style={inputSty}
                    value={g.name}
                    onChange={e => updateGroup(i, 'name', e.target.value)}
                    placeholder={`Group name (e.g. Wave ${i + 1})`}
                  />
                  <input
                    type="time"
                    className="px-3 py-2.5 rounded-xl border text-sm w-32 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/40"
                    style={inputSty}
                    value={g.start_time ?? ''}
                    onChange={e => updateGroup(i, 'start_time', e.target.value)}
                    title="Start time (optional)"
                  />
                  {groups.length > 1 && (
                    <button onClick={() => removeGroup(i)} className="px-3 text-sm cursor-pointer hover:opacity-60" style={{ color: 'var(--muted)' }}>✕</button>
                  )}
                </div>
              ))}
              <button onClick={addGroup} className="text-sm font-medium cursor-pointer hover:opacity-70" style={{ color: '#FF6B4A' }}>+ Add group</button>
            </div>
          )}

          {/* ── Step 4: Templates & metrics ── */}
          {step === 4 && (
            <div className="space-y-5">
              {templates.map((tmpl, ti) => (
                <div key={ti} className="p-5 rounded-2xl border space-y-3" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}>
                  <div className="flex items-center gap-2">
                    <input
                      className={inputCls}
                      style={inputSty}
                      value={tmpl.name}
                      onChange={e => updateTemplateName(ti, e.target.value)}
                      placeholder="Template name (e.g. Full Session)"
                    />
                    {templates.length > 1 && (
                      <button onClick={() => removeTemplate(ti)} className="px-2 text-sm cursor-pointer hover:opacity-60" style={{ color: 'var(--muted)' }}>✕</button>
                    )}
                  </div>
                  {tmpl.metrics.some(m => m.name.trim()) && (
                    <div className="flex flex-wrap gap-1.5">
                      {tmpl.metrics.filter(m => m.name.trim()).map((m, mi) => {
                        const chip = METRIC_CHIPS[m.type]
                        return (
                          <span key={mi} className="text-xs px-2.5 py-0.5 rounded-full" style={{ backgroundColor: chip.bg, color: chip.color }}>
                            {m.name}
                          </span>
                        )
                      })}
                    </div>
                  )}
                  {tmpl.metrics.map((m, mi) => (
                    <div key={mi} className="flex gap-2">
                      <input className={inputCls} style={inputSty} value={m.name} onChange={e => updateMetric(ti, mi, 'name', e.target.value)} placeholder="Metric name (e.g. Circuit Time)" />
                      <select className="px-3 py-2.5 rounded-xl border text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/40" style={inputSty} value={m.type} onChange={e => updateMetric(ti, mi, 'type', e.target.value)}>
                        <option value="time">Time</option>
                        <option value="count">Count</option>
                        <option value="pass_fail">Pass/Fail</option>
                      </select>
                      {m.type === 'count' && (
                        <input className="px-3 py-2.5 rounded-xl border text-sm w-20 focus:outline-none" style={inputSty} value={m.unit ?? ''} onChange={e => updateMetric(ti, mi, 'unit', e.target.value)} placeholder="unit" />
                      )}
                      {tmpl.metrics.length > 1 && (
                        <button onClick={() => removeMetric(ti, mi)} className="px-2 text-sm cursor-pointer hover:opacity-60" style={{ color: 'var(--muted)' }}>✕</button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => addMetric(ti)} className="text-xs font-medium cursor-pointer hover:opacity-70" style={{ color: '#FF6B4A' }}>+ Add metric</button>
                </div>
              ))}
              <button onClick={addTemplate} className="text-sm font-medium cursor-pointer hover:opacity-70" style={{ color: '#FF6B4A' }}>+ Add template</button>
              {errors.templates && <p className="text-xs mt-1" style={{ color: '#E5484D' }}>{errors.templates}</p>}
            </div>
          )}
        </div>
      </SlideIn>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        {step === 1 ? (
          <Link href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium hover:opacity-70 transition-colors" style={{ color: 'var(--muted)' }}>
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        ) : (
          <button onClick={goBack} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium cursor-pointer hover:opacity-70 transition-colors" style={{ color: 'var(--muted)' }}>
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        )}

        {step < 4 ? (
          <button
            onClick={goNext}
            className="group inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white cursor-pointer transition-all hover:opacity-90 active:scale-[0.97]"
            style={{ backgroundColor: '#FF6B4A', boxShadow: '0 4px 14px rgba(255,107,74,.25)' }}
          >
            Continue <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="group inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white cursor-pointer transition-all hover:opacity-90 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#FF6B4A', boxShadow: '0 4px 14px rgba(255,107,74,.25)' }}
          >
            {saving ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Create Event</>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /c/Users/joroc/desktop/spartan && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Run the dev server and verify visually**

```bash
npm run dev
```

Open http://localhost:3000/events/new. Verify:
- 4 thin progress bar segments at top, first segment coral, rest muted
- "Step 1 of 4, The basics" label below bars
- Heading "What's your event called?" in large bold display font
- Name input is auto-focused on load
- Coral border + green "Great name!" appear after typing a name
- Suggestion chips fill the name field when clicked
- "Continue →" button is coral with shadow
- Clicking Continue with empty name shows inline error "Event name is required"
- Step 2: Date, Venue, Description fields with uppercase bold labels
- Clicking Continue with no date shows "Date is required"
- Step 3: Group rows with name + time inputs, "+ Add group" link
- Step 4: Template cards with metric rows and colored chips
- Clicking completed (filled) progress bar segment navigates back to that step
- Back button on Step 1 is a link to `/dashboard`
- On Step 4 submit: spinner shows, then redirects to `/events/[id]` on success

- [ ] **Step 4: Commit**

```bash
git add src/app/events/new/wizard.tsx
git commit -m "feat: rewrite event wizard with 4-step badminton-style UI

Progress bars, conversational headings, SlideIn transitions,
suggestion chips on step 1, metric type chips on step 4.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
git push origin main
```

---

## Task 5: Deploy to Production

- [ ] **Step 1: Deploy**

```bash
cd /c/Users/joroc/desktop/spartan && vercel --prod
```

Expected: `Aliased: https://spartan.queueave.com`

- [ ] **Step 2: Smoke test production**

Open https://spartan.queueave.com/dashboard and https://spartan.queueave.com/events/new. Verify both pages load without errors.
