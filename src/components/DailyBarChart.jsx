import { useEffect, useRef } from 'react';
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatDayMonth, formatFull } from '../lib/dates.js';

function ChartTooltip({ active, payload, describe }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <p className="font-semibold text-zinc-200">{formatFull(point.date)}</p>
      <p className="text-zinc-400">{describe(point)}</p>
    </div>
  );
}

// Gráfico de barras por dia, com rolagem horizontal quando há muitos dias.
// Abre já rolado até os dias mais recentes. Não há eixo Y (ele sumiria na rolagem):
// os valores aparecem em cima das barras (valueLabel) ou pela legenda de cores.
export default function DailyBarChart({ data, dataKey, colorFor, describe, domain, valueLabel }) {
  const scrollRef = useRef(null);
  const width = Math.max(data.length * 34, 280);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [data.length]);

  return (
    <div ref={scrollRef} className="thin-scrollbar -mx-1 overflow-x-auto pb-1">
      <div style={{ width, minWidth: '100%' }}>
        <ResponsiveContainer width="100%" height={176}>
          <BarChart data={data} margin={{ top: valueLabel ? 18 : 6, right: 4, bottom: 0, left: 14 }}>
            <XAxis
              dataKey="date"
              tickFormatter={formatDayMonth}
              tick={{ fill: '#71717a', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
              tickLine={false}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={42}
            />
            <YAxis hide domain={domain} />
            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<ChartTooltip describe={describe} />} />
            <Bar dataKey={dataKey} radius={[6, 6, 6, 6]} maxBarSize={22} isAnimationActive={false}>
              {data.map((point) => (
                <Cell key={point.date} fill={colorFor(point)} />
              ))}
              {valueLabel && (
                <LabelList
                  dataKey={dataKey}
                  position="top"
                  formatter={valueLabel}
                  style={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 600 }}
                />
              )}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
