'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react'
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
  const [placeSelected, setPlaceSelected] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState('')
  const [selectedPlaceId, setSelectedPlaceId] = useState('')
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
