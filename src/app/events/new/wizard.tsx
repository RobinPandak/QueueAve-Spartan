'use client'
import { useState } from 'react'
import { createEvent, type WizardData } from '@/app/actions/events'

type Group = { name: string; start_time?: string }
type Metric = { name: string; type: 'time' | 'count' | 'pass_fail'; unit?: string }
type Template = { name: string; metrics: Metric[] }

export function EventWizard() {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [venue, setVenue] = useState('')
  const [description, setDescription] = useState('')
  const [groups, setGroups] = useState<Group[]>([{ name: '' }])
  const [templates, setTemplates] = useState<Template[]>([{ name: '', metrics: [{ name: '', type: 'time' }] }])
  const [saving, setSaving] = useState(false)

  const addGroup = () => setGroups(g => [...g, { name: '' }])
  const removeGroup = (i: number) => setGroups(g => g.filter((_, idx) => idx !== i))
  const updateGroup = (i: number, field: keyof Group, val: string) =>
    setGroups(g => g.map((gr, idx) => idx === i ? { ...gr, [field]: val } : gr))

  const addTemplate = () => setTemplates(t => [...t, { name: '', metrics: [{ name: '', type: 'time' }] }])
  const removeTemplate = (ti: number) => setTemplates(t => t.filter((_, i) => i !== ti))
  const updateTemplateName = (ti: number, val: string) =>
    setTemplates(t => t.map((tmpl, i) => i === ti ? { ...tmpl, name: val } : tmpl))
  const addMetric = (ti: number) =>
    setTemplates(t => t.map((tmpl, i) => i === ti ? { ...tmpl, metrics: [...tmpl.metrics, { name: '', type: 'time' }] } : tmpl))
  const removeMetric = (ti: number, mi: number) =>
    setTemplates(t => t.map((tmpl, i) => i === ti ? { ...tmpl, metrics: tmpl.metrics.filter((_, j) => j !== mi) } : tmpl))
  const updateMetric = (ti: number, mi: number, field: keyof Metric, val: string) =>
    setTemplates(t => t.map((tmpl, i) => i === ti ? {
      ...tmpl,
      metrics: tmpl.metrics.map((m, j) => j === mi ? { ...m, [field]: val } : m)
    } : tmpl))

  const handleSubmit = async () => {
    setSaving(true)
    await createEvent({
      name,
      date,
      venue,
      description,
      groups: groups.filter(g => g.name.trim()),
      templates: templates.filter(t => t.name.trim()),
    })
  }

  const inputClass = "w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/40"
  const inputStyle = { backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--fg)' }

  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{
                backgroundColor: s === step ? '#FF6B4A' : s < step ? '#FF6B4A22' : 'var(--subtle)',
                color: s === step ? 'white' : s < step ? '#FF6B4A' : 'var(--muted)',
              }}
            >
              {s}
            </div>
            {s < 3 && <div className="w-8 h-px" style={{ backgroundColor: 'var(--border)' }} />}
          </div>
        ))}
        <span className="ml-2 text-sm font-medium" style={{ color: 'var(--muted)' }}>
          {step === 1 ? 'Details' : step === 2 ? 'Groups' : 'Templates'}
        </span>
      </div>

      {/* Step 1: Details */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-extrabold mb-6" style={{ fontFamily: 'var(--font-bricolage)' }}>
            Event Details
          </h2>
          <div>
            <label className="block text-sm font-medium mb-1.5">Program name</label>
            <input
              className={inputClass}
              style={inputStyle}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. March Sprint Cohort"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Start date</label>
            <input
              type="date"
              className={inputClass}
              style={inputStyle}
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Venue <span style={{ color: 'var(--muted)' }}>(optional)</span>
            </label>
            <input
              className={inputClass}
              style={inputStyle}
              value={venue}
              onChange={e => setVenue(e.target.value)}
              placeholder="e.g. Spartan Training Ground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Description <span style={{ color: 'var(--muted)' }}>(optional)</span>
            </label>
            <textarea
              className={inputClass}
              style={inputStyle}
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief description of the training program"
            />
          </div>
          <button
            onClick={() => setStep(2)}
            disabled={!name.trim() || !date}
            className="w-full py-3 rounded-xl font-semibold text-white mt-2 cursor-pointer disabled:opacity-40 transition-all hover:shadow-md"
            style={{ backgroundColor: '#FF6B4A' }}
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 2: Groups */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-extrabold mb-6" style={{ fontFamily: 'var(--font-bricolage)' }}>
            Define Groups
          </h2>
          {groups.map((g, i) => (
            <div key={i} className="flex gap-2">
              <input
                className={inputClass}
                style={inputStyle}
                value={g.name}
                onChange={e => updateGroup(i, 'name', e.target.value)}
                placeholder={`Group name (e.g. Wave ${i + 1})`}
              />
              <input
                type="time"
                className="px-3 py-2.5 rounded-xl border text-sm w-32 flex-shrink-0"
                style={inputStyle}
                value={g.start_time || ''}
                onChange={e => updateGroup(i, 'start_time', e.target.value)}
                title="Start time (optional)"
              />
              {groups.length > 1 && (
                <button
                  onClick={() => removeGroup(i)}
                  className="px-3 text-sm cursor-pointer transition-colors hover:opacity-60"
                  style={{ color: 'var(--muted)' }}
                  title="Remove group"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button onClick={addGroup} className="text-sm font-medium cursor-pointer transition-colors hover:opacity-70" style={{ color: '#FF6B4A' }}>
            + Add group
          </button>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-3 rounded-xl font-semibold border cursor-pointer transition-all hover:shadow-md"
              style={{ borderColor: 'var(--border)', color: 'var(--fg)' }}
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!groups.some(g => g.name.trim())}
              className="flex-1 py-3 rounded-xl font-semibold text-white cursor-pointer disabled:opacity-40 transition-all hover:shadow-md"
              style={{ backgroundColor: '#FF6B4A' }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Templates */}
      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-extrabold mb-6" style={{ fontFamily: 'var(--font-bricolage)' }}>
            Session Templates
          </h2>
          {templates.map((tmpl, ti) => (
            <div key={ti} className="p-5 rounded-2xl border space-y-3" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}>
              <div className="flex items-center gap-2">
                <input
                  className={inputClass}
                  style={inputStyle}
                  value={tmpl.name}
                  onChange={e => updateTemplateName(ti, e.target.value)}
                  placeholder="Template name (e.g. Full Session)"
                />
                {templates.length > 1 && (
                  <button
                    onClick={() => removeTemplate(ti)}
                    className="px-2 text-sm cursor-pointer transition-colors hover:opacity-60"
                    style={{ color: 'var(--muted)' }}
                    title="Remove template"
                  >
                    ✕
                  </button>
                )}
              </div>
              {tmpl.metrics.map((m, mi) => (
                <div key={mi} className="flex gap-2">
                  <input
                    className={inputClass}
                    style={inputStyle}
                    value={m.name}
                    onChange={e => updateMetric(ti, mi, 'name', e.target.value)}
                    placeholder="Metric name (e.g. Circuit Time)"
                  />
                  <select
                    className="px-3 py-2.5 rounded-xl border text-sm cursor-pointer"
                    style={inputStyle}
                    value={m.type}
                    onChange={e => updateMetric(ti, mi, 'type', e.target.value)}
                  >
                    <option value="time">Time</option>
                    <option value="count">Count</option>
                    <option value="pass_fail">Pass/Fail</option>
                  </select>
                  {m.type === 'count' && (
                    <input
                      className="px-3 py-2.5 rounded-xl border text-sm w-20"
                      style={inputStyle}
                      value={m.unit || ''}
                      onChange={e => updateMetric(ti, mi, 'unit', e.target.value)}
                      placeholder="unit"
                    />
                  )}
                  {tmpl.metrics.length > 1 && (
                    <button
                      onClick={() => removeMetric(ti, mi)}
                      className="px-2 text-sm cursor-pointer transition-colors hover:opacity-60"
                      style={{ color: 'var(--muted)' }}
                      title="Remove metric"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button onClick={() => addMetric(ti)} className="text-xs font-medium cursor-pointer transition-colors hover:opacity-70" style={{ color: '#FF6B4A' }}>
                + Add metric
              </button>
            </div>
          ))}
          <button onClick={addTemplate} className="text-sm font-medium cursor-pointer transition-colors hover:opacity-70" style={{ color: '#FF6B4A' }}>
            + Add template
          </button>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setStep(2)}
              className="flex-1 py-3 rounded-xl font-semibold border cursor-pointer transition-all hover:shadow-md"
              style={{ borderColor: 'var(--border)', color: 'var(--fg)' }}
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || !templates.some(t => t.name.trim())}
              className="flex-1 py-3 rounded-xl font-semibold text-white cursor-pointer disabled:opacity-40 transition-all hover:shadow-md"
              style={{ backgroundColor: '#FF6B4A' }}
            >
              {saving ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
