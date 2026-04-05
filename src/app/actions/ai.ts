'use server'

import { AnthropicFoundry } from '@anthropic-ai/foundry-sdk'
import { createClient } from '@/lib/supabase/server'
import { parseTimeToSeconds, secondsToMmss } from '@/lib/progress'

function getClient() {
  return new AnthropicFoundry({
    apiKey: process.env.AZURE_FOUNDRY_API_KEY!,
    resource: process.env.AZURE_FOUNDRY_RESOURCE!,
  })
}

export async function getAthleteFeedback(
  participantId: string,
  eventId: string
): Promise<{ feedback: string } | { error: string }> {
  try {
    const supabase = await createClient()

    // Get athlete name
    const { data: participant } = await supabase
      .from('spartan_participants')
      .select('spartan_players(name)')
      .eq('id', participantId)
      .single()
    const athleteName = (participant?.spartan_players as any)?.name ?? 'Athlete'

    // Get all sessions for this event
    const { data: sessions } = await supabase
      .from('spartan_sessions')
      .select('id, session_date')
      .eq('event_id', eventId)
      .order('session_date')

    if (!sessions?.length) return { error: 'No session data yet.' }

    // Get all results for this participant
    const { data: results } = await supabase
      .from('spartan_results')
      .select('metric_id, time_value, count_value, pass_value, session_id')
      .eq('participant_id', participantId)
      .in('session_id', sessions.map(s => s.id))

    if (!results?.length) return { error: 'No results recorded yet.' }

    // Get metrics info
    const { data: templates } = await supabase
      .from('spartan_session_templates')
      .select('spartan_metrics(id, name, type)')
      .eq('event_id', eventId)

    const metrics: { id: string; name: string; type: string }[] =
      templates?.flatMap(t => (t.spartan_metrics as any[]) ?? []) ?? []

    // Build per-metric summary
    const metricSummaries: string[] = []
    for (const m of metrics) {
      const metricResults = results
        .filter(r => r.metric_id === m.id)
        .map(r => {
          if (m.type === 'time') {
            const secs = parseTimeToSeconds(r.time_value)
            return secs !== null ? secondsToMmss(secs) : null
          }
          if (m.type === 'count') return r.count_value != null ? String(r.count_value) : null
          if (m.type === 'pass_fail') return r.pass_value === true ? 'pass' : r.pass_value === false ? 'fail' : null
          return null
        })
        .filter(Boolean)

      if (!metricResults.length) continue
      metricSummaries.push(`${m.name}: ${metricResults.join(', ')}`)
    }

    if (!metricSummaries.length) return { error: 'No results recorded yet.' }

    const prompt = `You are a Spartan obstacle course race coach assistant helping coaches give quick feedback to athletes.

Athlete: ${athleteName}
Sessions recorded: ${sessions.length}
Results per obstacle:
${metricSummaries.join('\n')}

For pass/fail metrics, "fail" means the athlete didn't complete the obstacle.
For time metrics, lower is better.
For count metrics, higher is generally better.

Write a brief coaching note (2-3 sentences max) for the coach to share with this athlete. Focus on:
1. What needs the most improvement (be specific about which obstacle)
2. One or two simple drills or exercises to help improve that specific weakness

Keep it simple, practical, and encouraging. Plain text only, no bullet points or formatting.`

    const model = process.env.AZURE_FOUNDRY_MODEL || 'claude-sonnet-4-5'
    const message = await getClient().messages.create({
      model,
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    })

    const feedback = (message.content[0] as any).text as string
    return { feedback }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to generate feedback.' }
  }
}
