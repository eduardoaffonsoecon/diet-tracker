import { BarChart3, BookOpen, Download, Eye, EyeOff, Flame, Pizza, Timer } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CHEAT_LIMIT_PER_WEEK, RANGE_OPTIONS, SLEEP_OPTIONS, STUDY_OPTIONS } from '../lib/constants.js';
import { downloadCSV, entriesToCSV } from '../lib/csv.js';
import { formatDayMonth, todayISO } from '../lib/dates.js';
import { dietStreak, filterByRange, summarize, toChartData, weeklyCheats } from '../lib/stats.js';
import DailyBarChart from './DailyBarChart.jsx';
import { HABITS, SLEEP_TONES, STUDY_TONES } from './theme.js';
import { ActivityRings, Card, EmptyState, PageTitle, Segmented, StackedBar, cx } from './ui.jsx';

const percent = (part, total) => (total ? Math.round((part / total) * 100) : 0);
const decimal = (n) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

const WALK_COLOR = '#5eead4';

function Legend({ items }) {
  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function SectionTitle({ children, right }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="font-bold text-zinc-100">{children}</h3>
      {right}
    </div>
  );
}

function MetricTile({ Icon, iconClass, value, unit, label, hint }) {
  return (
    <Card className="p-4">
      <span className={cx('mb-3 grid h-9 w-9 place-items-center rounded-xl', iconClass)}>
        <Icon size={18} strokeWidth={2.2} aria-hidden />
      </span>
      <p className="text-3xl font-extrabold tabular-nums tracking-tight text-zinc-50">
        {value}
        {unit && <span className="ml-0.5 text-base font-bold text-zinc-400">{unit}</span>}
      </p>
      <p className="text-sm font-medium text-zinc-300">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>}
    </Card>
  );
}

function Distribution({ title, options, counts, tones, total }) {
  const missing = total - options.reduce((sum, o) => sum + counts[o.value], 0);
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-zinc-300">{title}</p>
      <StackedBar
        label={title}
        segments={options.map((o) => ({ key: o.value, value: counts[o.value], color: tones[o.value].hex }))}
      />
      <div className="mt-2 flex justify-between text-xs">
        {options.map((o) => (
          <span key={o.value} className="flex items-center gap-1.5 text-zinc-400">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tones[o.value].hex }} />
            {o.label}
            <span className="font-semibold tabular-nums text-zinc-200">{counts[o.value]}</span>
          </span>
        ))}
      </div>
      {missing > 0 && (
        <p className="mt-1 text-right text-[0.7rem] text-zinc-500">
          {missing} {missing === 1 ? 'dia' : 'dias'} sem informação
        </p>
      )}
    </div>
  );
}

export default function ReportView({ entries, userId }) {
  const [range, setRange] = useState(14);
  const [showPreview, setShowPreview] = useState(false);

  const filtered = useMemo(() => filterByRange(entries, range), [entries, range]);
  const stats = useMemo(() => summarize(filtered), [filtered]);
  const cheats = useMemo(() => weeklyCheats(filtered), [filtered]);
  const chartData = useMemo(() => toChartData(filtered), [filtered]);
  const streak = useMemo(() => dietStreak(entries), [entries]);

  const goals = [
    { key: 'diet', habit: HABITS.diet, label: 'Dieta', days: stats.dietDays },
    { key: 'sleep', habit: HABITS.sleep, label: 'Sono ≥ 6h', days: stats.sleepOkDays },
    { key: 'exercise', habit: HABITS.exercise, label: 'Exercício', days: stats.exerciseDays },
    { key: 'study', habit: HABITS.study, label: 'Estudo', days: stats.studyDays },
  ];

  const exportCSV = () => downloadCSV(`dieta_${userId}_${todayISO()}.csv`, entriesToCSV(filtered));

  return (
    <div className="space-y-3 motion-safe:animate-fade-up">
      <PageTitle title="Relatório" subtitle={`${filtered.length} de ${entries.length} registros no período`} />

      <Segmented label="Período" options={RANGE_OPTIONS} value={range} onChange={setRange} />

      {filtered.length === 0 ? (
        <EmptyState Icon={BarChart3} title="Sem registros no período" text="Escolha um período maior ou registre novos dias." />
      ) : (
        <>
          {/* Aderência às metas */}
          <Card className="bg-gradient-to-br from-white/[0.06] to-white/[0.02]">
            <SectionTitle>Aderência às metas</SectionTitle>
            <div className="flex items-center gap-5">
              <ActivityRings
                rings={goals.map((g) => ({ key: g.key, value: g.days / stats.total, color: g.habit.hex }))}
              />
              <ul className="min-w-0 flex-1 space-y-2.5">
                {goals.map((g) => (
                  <li key={g.key} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: g.habit.hex }} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-zinc-400">{g.label}</p>
                      <p className="text-[0.7rem] tabular-nums text-zinc-500">
                        {g.days}/{stats.total} dias
                      </p>
                    </div>
                    <span className={cx('text-lg font-extrabold tabular-nums', g.habit.text)}>
                      {percent(g.days, stats.total)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          {/* Números principais */}
          <div className="grid grid-cols-2 gap-3">
            <MetricTile
              Icon={Flame}
              iconClass="bg-orange-400/15 text-orange-300"
              value={streak}
              unit={streak === 1 ? ' dia' : ' dias'}
              label="Sequência na dieta"
              hint="dias seguidos até hoje"
            />
            <MetricTile
              Icon={Timer}
              iconClass={HABITS.exercise.badge}
              value={stats.avgExerciseMinutes}
              unit=" min"
              label="Exercício médio"
              hint="nos dias com treino"
            />
            <MetricTile
              Icon={BookOpen}
              iconClass={HABITS.study.badge}
              value={`~${decimal(stats.avgStudyHours)}`}
              unit=" h"
              label="Estudo médio"
              hint="nos dias com estudo"
            />
            <MetricTile
              Icon={Pizza}
              iconClass={HABITS.cheat.badge}
              value={decimal(cheats.avgPerWeek)}
              label="Livres por semana"
              hint={`${cheats.weeksOk}/${cheats.totalWeeks} semanas no limite de ${CHEAT_LIMIT_PER_WEEK}`}
            />
          </div>

          {/* Distribuições */}
          <Card className="space-y-5">
            <Distribution
              title="Sono"
              options={SLEEP_OPTIONS}
              counts={stats.sleepByCategory}
              tones={SLEEP_TONES}
              total={stats.total}
            />
            <Distribution
              title="Estudo"
              options={STUDY_OPTIONS}
              counts={stats.studyByCategory}
              tones={STUDY_TONES}
              total={0}
            />
          </Card>

          {/* Gráficos diários */}
          <Card>
            <SectionTitle>Sono por dia</SectionTitle>
            <DailyBarChart
              data={chartData}
              dataKey="sleepValue"
              colorFor={(d) => SLEEP_TONES[d.sleepCategory]?.hex ?? '#3f3f46'}
              describe={(d) => (d.sleepCategory ? `Sono: ${d.sleepCategory}` : 'Sono não informado')}
              domain={[0, 9]}
            />
            <Legend items={SLEEP_OPTIONS.map((o) => ({ label: o.label, color: SLEEP_TONES[o.value].hex }))} />
          </Card>

          <Card>
            <SectionTitle right={<span className="text-xs text-zinc-500">em minutos</span>}>Exercício por dia</SectionTitle>
            <DailyBarChart
              data={chartData}
              dataKey="exerciseMinutes"
              colorFor={(d) => (d.exercise === 'Caminhada' ? WALK_COLOR : HABITS.exercise.hex)}
              describe={(d) => (d.exerciseMinutes ? `${d.exercise ?? 'Exercício'} · ${d.exerciseMinutes} min` : 'Sem exercício')}
              domain={[0, 60]}
              valueLabel={(v) => (v ? `${v}` : '')}
            />
            <Legend
              items={[
                { label: 'Caminhada', color: WALK_COLOR },
                { label: 'Musculação', color: HABITS.exercise.hex },
              ]}
            />
          </Card>

          {/* Refeições livres por semana */}
          {cheats.weeks.length > 0 && (
            <Card>
              <SectionTitle right={<span className="text-xs text-zinc-500">limite: {CHEAT_LIMIT_PER_WEEK} por semana</span>}>
                Refeições livres
              </SectionTitle>
              <ul className="space-y-2">
                {cheats.weeks
                  .slice(-6)
                  .reverse()
                  .map((week) => {
                    const over = week.cheats > CHEAT_LIMIT_PER_WEEK;
                    return (
                      <li
                        key={week.weekStart}
                        className={cx(
                          'rounded-2xl px-3 py-2.5',
                          over ? 'bg-rose-500/10 ring-1 ring-inset ring-rose-400/40' : 'bg-white/[0.04]',
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm tabular-nums text-zinc-300">
                            {formatDayMonth(week.weekStart)} – {formatDayMonth(week.weekEnd)}
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="flex gap-1" aria-hidden>
                              {Array.from({ length: Math.max(CHEAT_LIMIT_PER_WEEK, week.cheats) }, (_, i) => (
                                <span
                                  key={i}
                                  className={cx(
                                    'h-2 w-2 rounded-full',
                                    i < week.cheats ? (over ? 'bg-rose-400' : 'bg-amber-400') : 'bg-white/10',
                                  )}
                                />
                              ))}
                            </span>
                            <span
                              className={cx(
                                'text-sm font-bold tabular-nums',
                                over ? 'text-rose-400' : week.cheats === 0 ? 'text-emerald-400' : 'text-amber-300',
                              )}
                            >
                              {week.cheats}/{CHEAT_LIMIT_PER_WEEK}
                            </span>
                          </span>
                        </div>
                        {week.details.length > 0 && (
                          <p className="mt-1 truncate text-xs text-zinc-500">{week.details.join(', ')}</p>
                        )}
                      </li>
                    );
                  })}
              </ul>
            </Card>
          )}

          {/* Exportação */}
          <Card>
            <SectionTitle>Exportar dados</SectionTitle>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={exportCSV}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-400 font-bold text-zinc-950 transition active:scale-[0.98]"
              >
                <Download size={18} strokeWidth={2.4} /> Baixar CSV
              </button>
              <button
                type="button"
                onClick={() => setShowPreview((v) => !v)}
                aria-expanded={showPreview}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-white/[0.06] px-4 font-semibold text-zinc-200 hover:bg-white/[0.1]"
              >
                {showPreview ? <EyeOff size={18} /> : <Eye size={18} />} Prévia
              </button>
            </div>
            {showPreview && (
              <div className="thin-scrollbar mt-3 overflow-x-auto rounded-2xl border border-white/[0.06] motion-safe:animate-fade-up">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.05] text-zinc-400">
                    <tr>
                      {['Data', 'Dieta', 'Exercício', 'Min', 'Sono', 'Estudo', 'Livre'].map((h) => (
                        <th key={h} className="whitespace-nowrap px-3 py-2 font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-zinc-300">
                    {filtered
                      .slice(-5)
                      .reverse()
                      .map((e) => (
                        <tr key={e.id} className="border-t border-white/[0.04]">
                          <td className="whitespace-nowrap px-3 py-2 tabular-nums">{formatDayMonth(e.date)}</td>
                          <td className="px-3 py-2">{e.diet ? 'Sim' : 'Não'}</td>
                          <td className="px-3 py-2">{e.exercise || '–'}</td>
                          <td className="px-3 py-2 tabular-nums">{e.exerciseMinutes || 0}</td>
                          <td className="px-3 py-2">{e.sleepCategory || '–'}</td>
                          <td className="px-3 py-2">{e.studied ? e.studyHours || 'Sim' : 'Não'}</td>
                          <td className="px-3 py-2">{e.cheatMeal ? 'Sim' : 'Não'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                <p className="border-t border-white/[0.04] px-3 py-2 text-[0.7rem] text-zinc-500">
                  Últimos 5 de {filtered.length} registros do período
                </p>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
