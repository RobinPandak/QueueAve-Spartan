'use client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { getTrendFromValues, TREND_COLOR, TREND_LABEL, type MetricType } from '@/lib/progress'

type ChartEntry = { date: string; value: number; label: string }
type ChartData = { metric: { id: string; name: string; type: string; unit?: string | null }; data: ChartEntry[] }

export function ProgressCharts({ chartData }: { chartData: ChartData[] }) {
  if (!chartData.length) return (
    <p className="text-sm text-center py-8" style={{ color: 'var(--muted)' }}>No session data yet.</p>
  )

  return (
    <div className="space-y-8">
      {chartData.map(({ metric, data }) => {
        const trend = getTrendFromValues(data.map(d => d.value), metric.type as MetricType)
        return (
          <div key={metric.id} className="p-5 rounded-2xl border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">{metric.name}{metric.unit ? ` (${metric.unit})` : ''}</h3>
              <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: `${TREND_COLOR[trend]}22`, color: TREND_COLOR[trend] }}>
                {TREND_LABEL[trend]}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={data}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} reversed={metric.type === 'time'} />
                <Tooltip
                  formatter={(val, _, props) => [props.payload.label, metric.name]}
                  contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }}
                />
                <Line type="monotone" dataKey="value" stroke="#FF6B4A" strokeWidth={2} dot={{ fill: '#FF6B4A', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )
      })}
    </div>
  )
}
