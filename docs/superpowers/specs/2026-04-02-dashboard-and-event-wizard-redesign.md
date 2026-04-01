# Dashboard + Event Creation Wizard Redesign

**Date:** 2026-04-02  
**Status:** Approved  
**Scope:** Two features — dashboard UI redesign, event creation wizard UI redesign

---

## Overview

Copy badminton.queueave.com's UI patterns into spartan.queueave.com. Keep all existing data fields, server actions, and business logic unchanged. Only the presentation layer changes.

---

## Feature 1: Dashboard Redesign

### Goal
Replace the current plain event list with badminton's card grid pattern: greeting, stats row, search/filter, Active/Past sections.

### Layout

```
[Greeting + stats row]          [+ New Event button]
[Search input]  [All | Active | Draft | Past filter tabs]
─── Active ● ────────────────────────────────────────────
[EventCard]  [EventCard]  [EventCard]
─── Past ────────────────────────────────────────────────
[PastCard]   [PastCard]   [PastCard]
```

### Data Requirements

The dashboard server component must fetch:
- `organizers.name` (for greeting) — already fetched for `organizer_id = user.id`
- All events for the organizer (existing query)
- Participant count per event — new: `COUNT(*) FROM spartan_participants WHERE event_id IN (...)`

Stats row values:
- **Active**: count of events with `status = 'open'`
- **Total events**: total count
- **Total participants**: sum across all events

### Components

**`DashboardPage` (server component)** — fetches data, passes to client.

**`EventsList` (new client component)** — replaces the current event list. Handles search + filter state client-side (no server round-trips). Props: `events: EventCard[]`, `coachName: string`.

```typescript
type EventCard = {
  id: string
  name: string
  date: string | null
  venue: string | null
  status: 'draft' | 'open' | 'completed'
  participant_count: number
}
```

**`ActiveCard` (within EventsList)** — for open events.
- `bg-card border border-border border-l-4 border-l-[#FF6B4A] rounded-2xl`
- Shows: name, status badge (teal), date (relative: "Today" / "Tomorrow" / "Mar 15"), venue if set, participant count
- Share join link button at bottom (Web Share API with clipboard fallback) — copies `[origin]/join/[eventId]`
- Hover: `hover:-translate-y-0.5 hover:shadow-md transition-all`

**`PastCard` (within EventsList)** — for completed and draft events.
- `bg-card/60 border border-border rounded-2xl` (muted)
- Shows: name, status badge, date, participant count
- No share button

**Greeting logic:**
```typescript
const hour = new Date().getHours()
const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
const firstName = coachName?.split(' ')[0] ?? ''
const title = firstName ? `${greeting}, ${firstName}` : 'My Events'
```

**Stats row:** `X active · Y events · Z participants` — active count styled coral, rest muted.

**Search:** shown only when `events.length >= 5`. Filters by `name.toLowerCase().includes(query)` client-side.

**Filter tabs:** All / Active / Draft / Past.
- Active = `status === 'open'`
- Past = `status === 'completed' || status === 'draft'`

**Empty state:** Keep existing Spartan empty state. Update the CTA button to pill shape (`rounded-full`) with coral glow shadow.

**`formatDate` helper:**
```typescript
// Same as badminton: "Today", "Tomorrow", "Yesterday", "Monday", "3 days ago", "Mar 15", "Mar 15, 2025"
function formatDate(dateStr: string | null): string
```

### Files to Change

| File | Change |
|------|--------|
| `src/app/dashboard/page.tsx` | Add participant count fetch, pass `coachName` + `events` to `EventsList` |
| `src/app/dashboard/events-list.tsx` | **New file** — `EventsList`, `ActiveCard`, `PastCard`, `formatDate` |

---

## Feature 2: Event Creation Wizard Redesign

### Goal
Replace the current 3-step wizard UI with badminton's wizard shell: thin progress bars, step labels, conversational headings, slide animations, coral Continue button. Keep all existing fields and the `createEvent` server action unchanged.

### Steps

| # | Label | Fields |
|---|-------|--------|
| 1 | The basics | Event name (large focused input + suggestion chips) |
| 2 | When & where | Date (required), Venue (optional), Description (optional) |
| 3 | Training groups | Dynamic group list — name + start time per group |
| 4 | Templates & metrics | Dynamic template list — name + metrics (name, type, unit) |

Step 4 includes the Create Event submit button (no separate Review step).

### Wizard Shell

**Progress bars:** 4 thin segments (`h-1.5 rounded-full`). Completed = `bg-[#FF6B4A]`, current = `bg-[#FF6B4A]/40`, upcoming = `bg-[var(--border)]`. Completed segments are clickable to navigate back.

**Step label:** `Step {n} of 4, {stepLabel}` — `text-xs text-[var(--muted)]`

**Step headings:** Conversational, large (`font-display text-2xl sm:text-3xl font-extrabold`):
- Step 1: "What's your event called?"
- Step 2: "When is it happening?"
- Step 3: "Who's training?"
- Step 4: "What are you measuring?"

**Slide animation:** Create a new `SlideIn` component at `src/components/slide-in.tsx` — CSS transition on opacity + translateX, direction prop (`'left' | 'right'`), controlled by a `show` boolean. Direction: slide right on Next, slide left on Back.

**Navigation:**
- Back button: `← Back` (link to `/dashboard` on Step 1, button on Steps 2-4)
- Continue button: coral, rounded-xl, `Continue →` with arrow icon
- Step 4 submit: coral, rounded-xl, `✦ Create Event` with Sparkles icon, loading spinner state

**Validation:** Same rules as current wizard (name required on Step 1, date required on Step 2, etc.).

### Step 1 — The Basics

- Large auto-focused text input (`text-lg font-semibold`)
- Coral focus ring on mount
- Inline validation: green "✓ Great name!" when `name.trim()` is non-empty and no error
- Suggestion chips (clickable, sets name):
  - "Spartan Sprint", "Obstacle Trial", "Team Qualifier", "Pre-season Camp"

### Step 2 — When & Where

- Date input (required, defaults to today ISO)
- Venue input (optional, text)
- Description textarea (optional, 2 rows)
- Uppercase bold labels with letter-spacing throughout

### Step 3 — Training Groups

- Same dynamic add/remove logic as current wizard
- Each group row: name input + start time input (optional) + remove button
- `+ Add group` link (coral)

### Step 4 — Templates & Metrics

- Same dynamic template + metric logic as current wizard
- Each template shows metrics as colored chips below the template name input
- Metric type badge colors: time = teal, count = yellow, pass_fail = muted
- `+ Add template` link (coral)
- Submit button at bottom: `✦ Create Event`

### Files to Change

| File | Change |
|------|--------|
| `src/app/events/new/wizard.tsx` | Full UI rewrite — new shell, progress bars, headings, slide animation, step split |
| `src/components/slide-in.tsx` | **New file** — `SlideIn` animation wrapper component |

The `createEvent` server action in `src/app/actions/events.ts` is **not changed**.

---

## What Is Not Changing

- All server actions (`createEvent`, `logout`, etc.)
- Database schema and queries
- Routing and redirects
- The session creation form at `/events/[id]/sessions/new` — left as-is
- Any page beyond dashboard and event creation

---

## Design Tokens

All new components use existing CSS variables:

| Token | Value |
|-------|-------|
| `var(--bg)` | `#FFF8F5` |
| `var(--fg)` | `#1A1A1A` |
| `var(--card)` | `#FFFFFF` |
| `var(--border)` | `#F0E0D6` |
| `var(--muted)` | `#6B6B6B` |
| `var(--subtle)` | `#F5F0ED` |
| Coral primary | `#FF6B4A` |
| Teal accent | `#00BFA5` |
