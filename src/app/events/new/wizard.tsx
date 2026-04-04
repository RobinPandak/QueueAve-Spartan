'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, Sparkles, CalendarDays, Clock, MapPin, Users, ClipboardList } from 'lucide-react'
import { createEvent } from '@/app/actions/events'
import SlideIn from '@/components/slide-in'
import PlacesAutocomplete from '@/components/places-autocomplete'

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

type Obstacle = { name: string; type: 'time' | 'count' | 'pass_fail'; unit?: string; isDefault?: boolean }

const SPARTAN_OBSTACLES: Obstacle[] = [
  // ── Common (shown by default) ──────────────────────
  { name: 'Rope Climb',         type: 'pass_fail', isDefault: true },
  { name: 'Monkey Bars',        type: 'pass_fail', isDefault: true },
  { name: 'Spear Throw',        type: 'pass_fail', isDefault: true },
  { name: 'Barbed Wire Crawl',  type: 'pass_fail', isDefault: true },
  { name: 'Bucket Carry',       type: 'pass_fail', isDefault: true },
  { name: 'Atlas Stone Carry',  type: 'pass_fail', isDefault: true },
  { name: 'Hercules Hoist',     type: 'pass_fail', isDefault: true },
  { name: 'Burpee Penalty',     type: 'count',     unit: 'reps', isDefault: true },
  { name: 'Course Time',        type: 'time',      isDefault: true },
  { name: 'Sprint 400m',        type: 'time',      isDefault: true },
  // ── More obstacles ─────────────────────────────────
  { name: 'Multi-Rig',          type: 'pass_fail' },
  { name: 'Z-Wall',             type: 'pass_fail' },
  { name: 'A-Frame Cargo Net',  type: 'pass_fail' },
  { name: 'Inverted Wall',      type: 'pass_fail' },
  { name: 'Slip Wall',          type: 'pass_fail' },
  { name: 'Tyrolean Traverse',  type: 'pass_fail' },
  { name: 'Plate Drag',         type: 'pass_fail' },
  { name: 'Sandbag Carry',      type: 'pass_fail' },
  { name: 'Box Jump',           type: 'pass_fail' },
  { name: 'Stairway to Sparta', type: 'pass_fail' },
  { name: 'Pull-ups',           type: 'count',     unit: 'reps' },
  { name: 'Obstacles Cleared',  type: 'count' },
]

const TEMPLATE_SUGGESTIONS = ['Obstacle Course Training', 'Strength Circuit', 'Sprint Drills', 'Full Session']

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
  const [socialPlatform, setSocialPlatform] = useState<'instagram' | 'facebook' | 'x' | 'tiktok'>('instagram')
  const [date, setDate]            = useState('')
  const [startTime, setStartTime]  = useState('')
  const [venue, setVenue]          = useState('')
  const [placeSelected, setPlaceSelected] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState('')
  const [selectedPlaceId, setSelectedPlaceId] = useState('')
  const [description, setDescription] = useState('')
  const [groups, setGroups]        = useState<Group[]>([{ name: '' }])
  const [templates, setTemplates]  = useState<Template[]>([{ name: '', metrics: [{ name: '', type: 'time' }] }])
  const [showMoreChips, setShowMoreChips] = useState<boolean[]>([false])

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

  const addTemplate        = () => {
    setTemplates(t => [...t, { name: '', metrics: [{ name: '', type: 'time' }] }])
    setShowMoreChips(s => [...s, false])
  }
  const removeTemplate     = (ti: number) => {
    setTemplates(t => t.filter((_, i) => i !== ti))
    setShowMoreChips(s => s.filter((_, i) => i !== ti))
  }

  function addPresetMetric(ti: number, obs: Obstacle) {
    setTemplates(t => t.map((tmpl, i) => {
      if (i !== ti) return tmpl
      const exists = tmpl.metrics.some(m => m.name === obs.name)
      if (exists) {
        const filtered = tmpl.metrics.filter(m => m.name !== obs.name)
        return { ...tmpl, metrics: filtered.length ? filtered : [{ name: '', type: 'time' }] }
      }
      const emptyIdx = tmpl.metrics.findIndex(m => !m.name.trim())
      if (emptyIdx >= 0) {
        return { ...tmpl, metrics: tmpl.metrics.map((m, j) => j === emptyIdx ? { name: obs.name, type: obs.type, unit: obs.unit } : m) }
      }
      return { ...tmpl, metrics: [...tmpl.metrics, { name: obs.name, type: obs.type, unit: obs.unit }] }
    }))
  }
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
    const hasAnyNamed = templates.some(t => t.name.trim())
    const newErrors: Record<string, string> = {}
    templates.forEach((t, i) => {
      if (!t.name.trim() && t.metrics.some(m => m.name.trim())) {
        newErrors[`templateName_${i}`] = 'Give this template a name'
      }
    })
    if (!hasAnyNamed) newErrors.templates = 'Add at least one template name'
    if (Object.keys(newErrors).length) { setErrors(newErrors); return }
    setSaving(true)
    await createEvent({
      name, date, start_time: startTime || undefined, venue, description,
      social_platform: socialPlatform,
      groups: groups.filter(g => g.name.trim()),
      templates: templates.filter(t => t.name.trim()),
    })
  }

  return (
    <div className="lg:grid lg:grid-cols-[1fr_260px] lg:gap-10">

      {/* ── Live preview (right column) ── */}
      <div className="hidden lg:block order-last">
        <div className="sticky top-24">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>Preview</p>
          <div className="rounded-2xl border p-5 space-y-4 transition-all duration-300" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>

            {/* Name */}
            <div>
              <h3 className="font-display font-bold text-base leading-snug" style={{ color: name.trim() ? 'var(--fg)' : 'rgba(107,107,107,.3)' }}>
                {name.trim() || 'Your event name'}
              </h3>
            </div>

            {/* Date + Venue */}
            {(date || venue) && (
              <div className="space-y-1.5">
                {date && (
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted)' }}>
                    <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
                    {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                )}
                {startTime && (
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted)' }}>
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    {new Date('1970-01-01T' + startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </div>
                )}
                {venue && (
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted)' }}>
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-[#FF6B4A]" />
                    <span className="truncate">{venue}</span>
                  </div>
                )}
              </div>
            )}

            {/* Groups (step 3+) */}
            {step >= 3 && groups.some(g => g.name.trim()) && (
              <div className="pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                  <Users className="w-3 h-3" /> Groups
                </div>
                <div className="space-y-1">
                  {groups.filter(g => g.name.trim()).map((g, i) => (
                    <div key={i} className="flex items-center justify-between text-xs rounded-lg px-2.5 py-1.5" style={{ backgroundColor: 'var(--subtle)' }}>
                      <span style={{ color: 'var(--fg)' }}>{g.name}</span>
                      {g.start_time && <span style={{ color: 'var(--muted)' }}>{g.start_time}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Templates (step 4+) */}
            {step >= 4 && templates.some(t => t.name.trim()) && (
              <div className="pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                  <ClipboardList className="w-3 h-3" /> Templates
                </div>
                <div className="space-y-2">
                  {templates.filter(t => t.name.trim()).map((t, i) => (
                    <div key={i} className="rounded-lg px-2.5 py-2" style={{ backgroundColor: 'var(--subtle)' }}>
                      <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--fg)' }}>{t.name}</p>
                      {t.metrics.some(m => m.name.trim()) && (
                        <div className="flex flex-wrap gap-1">
                          {t.metrics.filter(m => m.name.trim()).map((m, mi) => {
                            const chip = METRIC_CHIPS[m.type]
                            return (
                              <span key={mi} className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: chip.bg, color: chip.color }}>
                                {m.name}
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Placeholder when nothing filled yet */}
            {!name.trim() && !date && !venue && (
              <p className="text-xs" style={{ color: 'rgba(107,107,107,.4)' }}>Fill in the form to see your event take shape.</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Wizard form (left column) ── */}
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

          {/* Step 1: The basics */}
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

              {/* Social platform preference */}
              <div>
                <label className={labelCls} style={labelSty}>
                  Preferred social media{' '}
                  <span className="text-xs font-normal normal-case tracking-normal" style={{ color: 'var(--muted)' }}>for participant handles</span>
                </label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {(['instagram', 'facebook', 'x', 'tiktok'] as const).map(p => {
                    const labels: Record<string, string> = { instagram: 'Instagram', facebook: 'Facebook', x: 'X (Twitter)', tiktok: 'TikTok' }
                    const active = socialPlatform === p
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setSocialPlatform(p)}
                        className="px-3.5 py-2 text-sm rounded-xl border transition-all cursor-pointer"
                        style={{
                          backgroundColor: active ? 'rgba(255,107,74,.1)' : 'var(--card)',
                          borderColor: active ? '#FF6B4A' : 'var(--border)',
                          color: active ? '#FF6B4A' : 'var(--muted)',
                          fontWeight: active ? 600 : 400,
                        }}
                      >
                        {labels[p]}
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
                  Participants will be asked for their {socialPlatform === 'x' ? 'X' : socialPlatform.charAt(0).toUpperCase() + socialPlatform.slice(1)} handle during registration.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: When & where */}
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
                  Start time{' '}
                  <span className="text-xs font-normal normal-case tracking-normal" style={{ color: 'var(--muted)' }}>optional</span>
                </label>
                <input
                  type="time"
                  className={inputCls}
                  style={inputSty}
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls} style={labelSty}>
                  Venue{' '}
                  <span className="text-xs font-normal normal-case tracking-normal" style={{ color: 'var(--muted)' }}>optional</span>
                </label>
                <PlacesAutocomplete
                  value={venue}
                  onChange={setVenue}
                  onPlaceSelect={place => {
                    setVenue(place.name)
                    setPlaceSelected(true)
                    setSelectedAddress(place.address)
                    setSelectedPlaceId(place.placeId)
                  }}
                  onClear={() => {
                    setVenue('')
                    setPlaceSelected(false)
                    setSelectedAddress('')
                    setSelectedPlaceId('')
                  }}
                  placeSelected={placeSelected}
                  selectedAddress={selectedAddress}
                  selectedPlaceId={selectedPlaceId}
                />
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

          {/* Step 3: Training groups */}
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

          {/* Step 4: Templates & metrics */}
          {step === 4 && (
            <div className="space-y-5">
              {templates.map((tmpl, ti) => (
                <div key={ti} className="p-5 rounded-2xl border space-y-3" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <input
                        className={inputCls}
                        style={{ ...inputSty, borderColor: errors[`templateName_${ti}`] ? '#E5484D' : 'var(--border)' }}
                        value={tmpl.name}
                        onChange={e => { updateTemplateName(ti, e.target.value); setErrors(prev => { const n = { ...prev }; delete n[`templateName_${ti}`]; delete n.templates; return n }) }}
                        placeholder="Template name (e.g. Full Session)"
                      />
                      {templates.length > 1 && (
                        <button onClick={() => removeTemplate(ti)} className="px-2 text-sm cursor-pointer hover:opacity-60" style={{ color: 'var(--muted)' }}>✕</button>
                      )}
                    </div>
                    {errors[`templateName_${ti}`] && (
                      <p className="text-xs" style={{ color: '#E5484D' }}>{errors[`templateName_${ti}`]}</p>
                    )}
                  </div>

                  {/* Template name suggestions */}
                  {!tmpl.name.trim() && (
                    <div className="flex flex-wrap gap-1.5">
                      {TEMPLATE_SUGGESTIONS.map(s => (
                        <button key={s} type="button" onClick={() => updateTemplateName(ti, s)}
                          className="px-2.5 py-1 text-xs rounded-lg border cursor-pointer hover:border-[#FF6B4A] transition-all"
                          style={{ backgroundColor: 'var(--subtle)', borderColor: 'var(--border)', color: 'var(--muted)' }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Quick-add obstacle chips */}
                  <div className="space-y-2 pt-1">
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Quick add</p>
                    <div className="flex flex-wrap gap-1.5">
                      {SPARTAN_OBSTACLES.filter(o => o.isDefault).map(obs => {
                        const added = tmpl.metrics.some(m => m.name === obs.name)
                        return (
                          <button key={obs.name} type="button" onClick={() => addPresetMetric(ti, obs)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border cursor-pointer transition-all"
                            style={{
                              backgroundColor: added ? 'rgba(0,191,165,.12)' : 'rgba(255,107,74,.08)',
                              borderColor: added ? '#00BFA5' : 'rgba(255,107,74,.25)',
                              color: added ? '#00896E' : '#C44A2A',
                            }}>
                            {added && <Check className="w-3 h-3" />}
                            {obs.name}
                          </button>
                        )
                      })}
                    </div>
                    {!(showMoreChips[ti]) ? (
                      <button type="button"
                        onClick={() => setShowMoreChips(s => s.map((v, i) => i === ti ? true : v))}
                        className="text-xs cursor-pointer hover:opacity-70 transition-opacity"
                        style={{ color: 'var(--muted)' }}>
                        + More obstacles
                      </button>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap gap-1.5">
                          {SPARTAN_OBSTACLES.filter(o => !o.isDefault).map(obs => {
                            const added = tmpl.metrics.some(m => m.name === obs.name)
                            return (
                              <button key={obs.name} type="button" onClick={() => addPresetMetric(ti, obs)}
                                className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border cursor-pointer transition-all"
                                style={{
                                  backgroundColor: added ? 'rgba(0,191,165,.12)' : 'var(--subtle)',
                                  borderColor: added ? '#00BFA5' : 'var(--border)',
                                  color: added ? '#00896E' : 'var(--muted)',
                                }}>
                                {added && <Check className="w-3 h-3" />}
                                {obs.name}
                              </button>
                            )
                          })}
                        </div>
                        <button type="button"
                          onClick={() => setShowMoreChips(s => s.map((v, i) => i === ti ? false : v))}
                          className="text-xs cursor-pointer hover:opacity-70 transition-opacity"
                          style={{ color: 'var(--muted)' }}>
                          Show less
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t pt-2" style={{ borderColor: 'var(--border)' }}>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>Metrics</p>
                  </div>

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
    </div>
  )
}
