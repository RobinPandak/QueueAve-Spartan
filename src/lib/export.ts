type ParticipantRow = {
  name: string
  status: string | null
  group_id: string | null
  email?: string | null
}

export function downloadParticipantsCsv(
  participants: ParticipantRow[],
  groups: { id: string; name: string }[],
  eventName: string,
) {
  const header = ['Name', 'Status', 'Group', 'Email']
  const rows = participants.map(p => [
    p.name,
    p.status ?? 'pending',
    groups.find(g => g.id === p.group_id)?.name ?? '',
    p.email ?? '',
  ])
  const csv = [header, ...rows]
    .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${eventName.replace(/\s+/g, '-').toLowerCase()}-athletes.csv`
  a.click()
  URL.revokeObjectURL(url)
}
