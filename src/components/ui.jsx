import { LoaderCircle } from 'lucide-react';

export const cx = (...classes) => classes.filter(Boolean).join(' ');

export function Card({ className, children, ...props }) {
  return (
    <section
      className={cx('rounded-3xl border border-white/[0.06] bg-white/[0.035] p-4 shadow-xl shadow-black/20', className)}
      {...props}
    >
      {children}
    </section>
  );
}

export function IconBadge({ habit, Icon = habit.Icon, size = 'md' }) {
  return (
    <span
      className={cx(
        'grid shrink-0 place-items-center rounded-2xl',
        habit.badge,
        size === 'sm' ? 'h-8 w-8 rounded-xl' : 'h-11 w-11',
      )}
    >
      <Icon size={size === 'sm' ? 16 : 20} strokeWidth={2.2} aria-hidden />
    </span>
  );
}

// Cabeçalho padrão dos cartões de hábito: ícone, título, resumo e um controle à direita.
export function HabitCard({ habit, title = habit.label, summary, summaryClass, right, children, className }) {
  return (
    <Card className={className}>
      <div className="flex items-center gap-3">
        <IconBadge habit={habit} />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold leading-tight text-zinc-100">{title}</h3>
          {summary && <p className={cx('truncate text-sm', summaryClass ?? 'text-zinc-400')}>{summary}</p>}
        </div>
        {right}
      </div>
      {children && <div className="mt-4 space-y-3">{children}</div>}
    </Card>
  );
}

export function Switch({ checked, onChange, label, activeClass = 'bg-emerald-400' }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx(
        'relative h-8 w-14 shrink-0 rounded-full transition-colors duration-200',
        checked ? activeClass : 'bg-zinc-700',
      )}
    >
      <span
        className={cx(
          'absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200',
          checked && 'translate-x-6',
        )}
      />
    </button>
  );
}

// Botões de escolha única. Tocar de novo na opção marcada desmarca (volta para emptyValue).
export function ChoiceGroup({ options, value, onChange, emptyValue = '', activeClass, label, size = 'md' }) {
  return (
    <div role="group" aria-label={label} className="flex gap-2">
      {options.map((option) => {
        const selected = value === option.value;
        const Icon = option.Icon;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(selected ? emptyValue : option.value)}
            className={cx(
              'flex flex-1 items-center justify-center gap-2 rounded-2xl font-semibold transition-all duration-150 active:scale-[0.97]',
              size === 'lg' ? 'min-h-[3.5rem] text-[0.95rem]' : 'min-h-[2.75rem] text-sm',
              selected
                ? cx(option.activeClass ?? activeClass, 'shadow-lg shadow-black/30')
                : 'bg-white/[0.05] text-zinc-300 hover:bg-white/[0.09]',
            )}
          >
            {Icon && <Icon size={18} strokeWidth={2.2} aria-hidden />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function Segmented({ options, value, onChange, label }) {
  return (
    <div role="group" aria-label={label} className="flex rounded-2xl bg-white/[0.05] p-1">
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cx(
              'flex-1 rounded-xl py-2 text-sm font-semibold transition-all duration-150',
              selected ? 'bg-zinc-100 text-zinc-950 shadow' : 'text-zinc-400 hover:text-zinc-200',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function Spinner({ size = 18, className }) {
  return <LoaderCircle size={size} className={cx('animate-spin', className)} aria-hidden />;
}

export function EmptyState({ Icon, title, text, action }) {
  return (
    <Card className="flex flex-col items-center px-6 py-10 text-center">
      <span className="mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-emerald-400/10 text-emerald-300">
        <Icon size={30} strokeWidth={1.8} aria-hidden />
      </span>
      <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
      <p className="mt-1 max-w-[16rem] text-sm text-zinc-400">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}

export function PageTitle({ title, subtitle, right }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-zinc-50">{title}</h2>
        {subtitle && <p className="text-sm text-zinc-400">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

// Anéis concêntricos de progresso (0 a 1), do mais externo para o mais interno.
export function ActivityRings({ rings, size = 148, stroke = 11, gap = 3 }) {
  const center = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90" aria-hidden>
      {rings.map((ring, i) => {
        const radius = center - stroke / 2 - i * (stroke + gap);
        const circumference = 2 * Math.PI * radius;
        const value = Math.min(Math.max(ring.value, 0), 1);
        return (
          <g key={ring.key ?? i}>
            <circle cx={center} cy={center} r={radius} fill="none" stroke={ring.color} strokeOpacity={0.16} strokeWidth={stroke} />
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={ring.color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - value)}
              style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
              opacity={value > 0 ? 1 : 0}
            />
          </g>
        );
      })}
    </svg>
  );
}

// Barra horizontal dividida em segmentos proporcionais.
export function StackedBar({ segments, label }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/[0.06]" role="img" aria-label={label}>
      {total > 0 &&
        segments.map((s) =>
          s.value > 0 ? (
            <div
              key={s.key}
              className="h-full transition-all duration-500"
              style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }}
            />
          ) : null,
        )}
    </div>
  );
}
