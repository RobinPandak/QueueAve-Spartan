import { EventWizard } from './wizard'

export default function NewEventPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="max-w-5xl mx-auto px-6 py-12">
        <EventWizard />
      </div>
    </div>
  )
}
