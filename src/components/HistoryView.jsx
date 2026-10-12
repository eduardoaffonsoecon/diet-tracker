import { Check, NotebookPen, Pencil, Trash2, X } from 'lucide-react';
import { formatMonth, parseISODate, relativeDayLabel } from '../lib/dates.js';
import { EXERCISE_ICONS, HABITS, SLEEP_TONES } from './theme.js';
import { EmptyState, PageTitle, cx } from './ui.jsx';

function Chip({ className, Icon, children }) {
  return (
    <span className={cx('inline-flex max-w-full items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', className)}>
      {Icon && <Icon size={13} strokeWidth={2.4} className="shrink-0" aria-hidden />}
      <span className="truncate">{children}</span>
    </span>
  );
}

function EntryRow({ entry, onEdit, onDelete }) {
  const date = parseISODate(entry.date);
  const relative = relativeDayLabel(entry.date);
  const ExerciseIcon = EXERCISE_ICONS[entry.exercise] ?? HABITS.exercise.Icon;

  return (
    <li className="flex items-stretch gap-1 rounded-3xl border border-white/[0.06] bg-white/[0.035] transition-colors hover:bg-white/[0.06]">
      <button
        type="button"
        onClick={() => onEdit(entry.date)}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-3xl p-3 text-left"
        aria-label={`Editar registro de ${date.toLocaleDateString('pt-BR')}`}
      >
        <div
          className={cx(
            'flex w-14 shrink-0 flex-col items-center justify-center rounded-2xl py-2',
            entry.diet ? 'bg-emerald-400/10' : 'bg-rose-400/10',
          )}
        >
          <span className="text-[0.65rem] font-bold uppercase tracking-wide text-zinc-400">
            {relative ?? date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
          </span>
          <span className={cx('text-xl font-extrabold tabular-nums', entry.diet ? 'text-emerald-300' : 'text-rose-300')}>
            {date.getDate()}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          <Chip className={entry.diet ? HABITS.diet.badge : HABITS.cheat.badge} Icon={entry.diet ? Check : X}>
            Dieta
          </Chip>
          {entry.exerciseMinutes > 0 && (
            <Chip className={HABITS.exercise.badge} Icon={ExerciseIcon}>
              {entry.exerciseMinutes} min
            </Chip>
          )}
          {entry.sleepCategory && (
            <Chip
              className={cx('bg-white/[0.06]', SLEEP_TONES[entry.sleepCategory]?.text)}
              Icon={HABITS.sleep.Icon}
            >
              {entry.sleepCategory}
            </Chip>
          )}
          {entry.studied && (
            <Chip className={HABITS.study.badge} Icon={HABITS.study.Icon}>
              {entry.studyHours || 'Estudou'}
            </Chip>
          )}
          {entry.cheatMeal && (
            <Chip className={HABITS.cheat.badge} Icon={HABITS.cheat.Icon}>
              {entry.cheatMealDesc || 'Refeição livre'}
            </Chip>
          )}
        </div>

        <Pencil size={15} className="shrink-0 text-zinc-600" aria-hidden />
      </button>

      <button
        type="button"
        onClick={() => onDelete(entry)}
        aria-label={`Excluir registro de ${date.toLocaleDateString('pt-BR')}`}
        className="grid w-12 shrink-0 place-items-center rounded-r-3xl text-zinc-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
      >
        <Trash2 size={18} />
      </button>
    </li>
  );
}

export default function HistoryView({ entries, onEdit, onDelete, onStart }) {
  if (entries.length === 0) {
    return (
      <div className="motion-safe:animate-fade-up">
        <PageTitle title="Histórico" />
        <EmptyState
          Icon={NotebookPen}
          title="Nenhum registro ainda"
          text="Registre seu primeiro dia para começar a acompanhar seus hábitos."
          action={
            <button
              type="button"
              onClick={onStart}
              className="rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 px-5 py-3 font-bold text-zinc-950 shadow-lg shadow-emerald-500/20"
            >
              Registrar hoje
            </button>
          }
        />
      </div>
    );
  }

  // Mais recentes primeiro, agrupados por mês.
  const months = [];
  for (const entry of [...entries].reverse()) {
    const key = entry.date.slice(0, 7);
    let month = months[months.length - 1];
    if (month?.key !== key) {
      month = { key, label: formatMonth(entry.date), entries: [] };
      months.push(month);
    }
    month.entries.push(entry);
  }

  return (
    <div className="motion-safe:animate-fade-up">
      <PageTitle
        title="Histórico"
        subtitle={`${entries.length} ${entries.length === 1 ? 'dia registrado' : 'dias registrados'}`}
      />
      <div className="space-y-6">
        {months.map((month) => (
          <section key={month.key}>
            <h3 className="mb-2 px-1 text-xs font-bold uppercase tracking-widest text-zinc-500">{month.label}</h3>
            <ul className="space-y-2">
              {month.entries.map((entry) => (
                <EntryRow key={entry.id} entry={entry} onEdit={onEdit} onDelete={onDelete} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
