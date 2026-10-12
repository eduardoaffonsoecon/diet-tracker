import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, formatMonth, parseISODate, startOfWeek, todayISO } from '../lib/dates.js';
import { cx } from './ui.jsx';

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

// Faixa com os 7 dias da semana da data escolhida. O ponto embaixo do dia
// mostra se já há registro: verde quando seguiu a dieta, rosa quando não.
export default function WeekStrip({ date, onChange, entriesByDate }) {
  const today = todayISO();
  const weekStart = startOfWeek(date);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const canGoForward = addDays(weekStart, 7) <= today;

  const openPicker = (event) => {
    try {
      event.currentTarget.showPicker?.();
    } catch {
      // Navegadores sem showPicker abrem o seletor pelo próprio toque no campo.
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="relative flex items-center gap-2 rounded-xl px-1 py-1 text-sm font-semibold text-zinc-300">
          <CalendarDays size={16} className="text-emerald-400" aria-hidden />
          {formatMonth(date)}
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => e.target.value && onChange(e.target.value)}
            onClick={openPicker}
            aria-label="Escolher data"
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </div>
        <div className="flex items-center gap-1">
          {date !== today && (
            <button
              type="button"
              onClick={() => onChange(today)}
              className="mr-1 rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-400/25"
            >
              Hoje
            </button>
          )}
          <button
            type="button"
            onClick={() => onChange(addDays(date, -7))}
            aria-label="Semana anterior"
            className="grid h-8 w-8 place-items-center rounded-full text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => onChange(addDays(date, 7) > today ? today : addDays(date, 7))}
            disabled={!canGoForward}
            aria-label="Próxima semana"
            className="grid h-8 w-8 place-items-center rounded-full text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const entry = entriesByDate.get(day);
          const selected = day === date;
          const future = day > today;
          return (
            <button
              key={day}
              type="button"
              disabled={future}
              onClick={() => onChange(day)}
              aria-pressed={selected}
              aria-label={parseISODate(day).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              className={cx(
                'flex flex-col items-center gap-1 rounded-2xl py-2 transition-all duration-150',
                selected
                  ? 'bg-gradient-to-b from-emerald-300 to-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/25'
                  : day === today
                    ? 'bg-white/[0.04] text-emerald-300 ring-1 ring-inset ring-emerald-400/40'
                    : 'text-zinc-300 hover:bg-white/[0.06]',
                future && 'opacity-30',
              )}
            >
              <span className={cx('text-[0.65rem] font-semibold', selected ? 'text-zinc-900/70' : 'text-zinc-500')}>
                {WEEKDAYS[parseISODate(day).getDay()]}
              </span>
              <span className="text-base font-bold tabular-nums leading-none">{parseISODate(day).getDate()}</span>
              <span
                className={cx(
                  'h-1.5 w-1.5 rounded-full',
                  !entry && 'bg-transparent',
                  entry && (selected ? 'bg-zinc-950' : entry.diet ? 'bg-emerald-400' : 'bg-rose-400'),
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
