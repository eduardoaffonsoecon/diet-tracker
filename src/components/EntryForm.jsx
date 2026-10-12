import { Check, CircleAlert, X } from 'lucide-react';
import { useState } from 'react';
import { EXERCISE_DURATIONS, EXERCISE_TYPES, SLEEP_OK, SLEEP_OPTIONS, STUDY_OPTIONS } from '../lib/constants.js';
import { formatDayMonthLong, formatWeekdayName, relativeDayLabel } from '../lib/dates.js';
import { EXERCISE_ICONS, HABITS, SLEEP_TONES } from './theme.js';
import { Card, ChoiceGroup, HabitCard, IconBadge, Spinner, Switch, cx } from './ui.jsx';
import WeekStrip from './WeekStrip.jsx';

const fieldsFrom = (entry) => ({
  diet: entry?.diet ?? true,
  exercise: entry?.exercise ?? '',
  exerciseMinutes: entry?.exercise ? entry.exerciseMinutes ?? 0 : 0,
  sleepCategory: entry?.sleepCategory ?? '',
  studied: entry?.studied ?? false,
  studyHours: entry?.studyHours ?? '',
  cheatMeal: entry?.cheatMeal ?? false,
  cheatMealDesc: entry?.cheatMealDesc ?? '',
});

// Converte o estado do formulário no formato gravado no Firebase.
const toEntryFields = (f) => ({
  diet: f.diet,
  exercise: f.exercise && f.exerciseMinutes > 0 ? f.exercise : null,
  exerciseMinutes: f.exercise ? f.exerciseMinutes : 0,
  sleepCategory: f.sleepCategory,
  sleepOk: SLEEP_OK.includes(f.sleepCategory),
  cheatMeal: f.cheatMeal,
  cheatMealDesc: f.cheatMeal ? f.cheatMealDesc.trim() || null : null,
  studied: f.studied,
  studyHours: f.studied ? f.studyHours : null,
});

const sameFields = (a, b) => JSON.stringify(toEntryFields(a)) === JSON.stringify(toEntryFields(b));

function validate(f) {
  if (f.exercise && !f.exerciseMinutes) return 'Escolha a duração do exercício.';
  if (f.studied && !f.studyHours) return 'Escolha quanto tempo você estudou.';
  return null;
}

export default function EntryForm({ date, existing, entriesByDate, onDateChange, onSave, saving }) {
  const [fields, setFields] = useState(() => fieldsFrom(existing));
  const set = (patch) => setFields((f) => ({ ...f, ...patch }));

  const error = validate(fields);
  const dirty = !existing || !sameFields(fields, fieldsFrom(existing));
  const dayLabel = relativeDayLabel(date);
  const sleepOption = SLEEP_OPTIONS.find((o) => o.value === fields.sleepCategory);
  const studyOption = STUDY_OPTIONS.find((o) => o.value === fields.studyHours);

  const submit = (event) => {
    event.preventDefault();
    if (!error && dirty && !saving) onSave(toEntryFields(fields));
  };

  return (
    <form onSubmit={submit} className="space-y-3 motion-safe:animate-fade-up">
      <Card>
        <WeekStrip date={date} onChange={onDateChange} entriesByDate={entriesByDate} />
      </Card>

      <div className="flex items-center justify-between px-1 pt-2">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-50">{dayLabel ?? formatWeekdayName(date)}</h2>
          <p className="text-sm text-zinc-400">
            {dayLabel ? `${formatWeekdayName(date)}, ${formatDayMonthLong(date)}` : formatDayMonthLong(date)}
          </p>
        </div>
        <span
          className={cx(
            'rounded-full px-3 py-1 text-xs font-semibold',
            !existing && 'bg-white/[0.06] text-zinc-300',
            existing && dirty && 'bg-amber-400/15 text-amber-300',
            existing && !dirty && 'bg-emerald-400/15 text-emerald-300',
          )}
        >
          {!existing ? 'Novo registro' : dirty ? 'Alterações não salvas' : 'Registro salvo'}
        </span>
      </div>

      {/* Dieta */}
      <Card>
        <div className="flex items-center gap-3">
          <IconBadge habit={HABITS.diet} />
          <div className="flex-1">
            <h3 className="font-semibold leading-tight text-zinc-100">Dieta</h3>
            <p className="text-sm text-zinc-400">Seguiu o plano alimentar?</p>
          </div>
        </div>
        <div className="mt-4">
          <ChoiceGroup
            label="Dieta"
            size="lg"
            value={fields.diet}
            emptyValue={fields.diet}
            onChange={(diet) => set({ diet })}
            options={[
              { value: true, label: 'Segui', Icon: Check, activeClass: HABITS.diet.solid },
              { value: false, label: 'Escapei', Icon: X, activeClass: 'bg-rose-400 text-zinc-950' },
            ]}
          />
        </div>
      </Card>

      {/* Exercício */}
      <HabitCard
        habit={HABITS.exercise}
        title="Atividade física"
        summary={
          fields.exercise
            ? `${fields.exercise}${fields.exerciseMinutes ? ` · ${fields.exerciseMinutes} min` : ''}`
            : 'Nenhuma atividade'
        }
        summaryClass={fields.exercise ? 'text-sky-300' : undefined}
      >
        <ChoiceGroup
          label="Tipo de exercício"
          size="lg"
          value={fields.exercise}
          activeClass={HABITS.exercise.solid}
          onChange={(exercise) => set({ exercise, exerciseMinutes: exercise ? fields.exerciseMinutes : 0 })}
          options={EXERCISE_TYPES.map((t) => ({ ...t, Icon: EXERCISE_ICONS[t.value] }))}
        />
        {fields.exercise && (
          <div className="motion-safe:animate-fade-up">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Duração</p>
            <ChoiceGroup
              label="Duração do exercício"
              value={fields.exerciseMinutes}
              emptyValue={0}
              activeClass={HABITS.exercise.solid}
              onChange={(exerciseMinutes) => set({ exerciseMinutes })}
              options={EXERCISE_DURATIONS}
            />
          </div>
        )}
      </HabitCard>

      {/* Sono */}
      <HabitCard
        habit={HABITS.sleep}
        title="Sono"
        summary={sleepOption ? sleepOption.hint : 'Quantas horas você dormiu?'}
        summaryClass={sleepOption ? SLEEP_TONES[sleepOption.value].text : undefined}
      >
        <ChoiceGroup
          label="Horas de sono"
          value={fields.sleepCategory}
          onChange={(sleepCategory) => set({ sleepCategory })}
          options={SLEEP_OPTIONS.map((o) => ({ ...o, activeClass: SLEEP_TONES[o.value].solid }))}
        />
      </HabitCard>

      {/* Estudo */}
      <HabitCard
        habit={HABITS.study}
        title="Estudo"
        summary={fields.studied ? (studyOption ? `Estudou ${studyOption.label}` : 'Quanto tempo?') : 'Não estudou'}
        summaryClass={fields.studied ? 'text-amber-300' : undefined}
        right={
          <Switch
            label="Estudou hoje"
            checked={fields.studied}
            onChange={(studied) => set({ studied, studyHours: studied ? fields.studyHours : '' })}
            activeClass="bg-amber-400"
          />
        }
      >
        {fields.studied && (
          <div className="motion-safe:animate-fade-up">
            <ChoiceGroup
              label="Horas de estudo"
              value={fields.studyHours}
              activeClass={HABITS.study.solid}
              onChange={(studyHours) => set({ studyHours })}
              options={STUDY_OPTIONS}
            />
          </div>
        )}
      </HabitCard>

      {/* Refeição livre */}
      <HabitCard
        habit={HABITS.cheat}
        summary={fields.cheatMeal ? fields.cheatMealDesc || 'O que você comeu?' : 'Nenhuma hoje'}
        summaryClass={fields.cheatMeal ? 'text-rose-300' : undefined}
        right={
          <Switch
            label="Teve refeição livre"
            checked={fields.cheatMeal}
            onChange={(cheatMeal) => set({ cheatMeal })}
            activeClass="bg-rose-400"
          />
        }
      >
        {fields.cheatMeal && (
          <input
            type="text"
            value={fields.cheatMealDesc}
            onChange={(e) => set({ cheatMealDesc: e.target.value })}
            placeholder="Ex.: pizza, hambúrguer, sobremesa…"
            aria-label="O que você comeu"
            maxLength={120}
            className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.05] px-4 py-3 text-base text-zinc-100 placeholder:text-zinc-500 focus:border-rose-400/60 focus:outline-none motion-safe:animate-fade-up"
          />
        )}
      </HabitCard>

      {/* Botão fixo logo acima da navegação, com fundo para não sobrepor o conteúdo */}
      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 -mx-4 bg-gradient-to-t from-[#09090b] via-[#09090b]/95 to-transparent px-4 pb-4 pt-6">
        {error && (
          <p className="mb-2 flex items-center justify-center gap-1.5 rounded-xl bg-amber-400/10 py-2 text-sm font-medium text-amber-300 backdrop-blur">
            <CircleAlert size={16} aria-hidden /> {error}
          </p>
        )}
        <button
          type="submit"
          disabled={Boolean(error) || !dirty || saving}
          className={cx(
            'flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-bold transition-all duration-150 active:scale-[0.98]',
            dirty
              ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-zinc-950 shadow-xl shadow-emerald-500/25 disabled:opacity-50'
              : 'bg-zinc-800/90 text-emerald-300 backdrop-blur',
          )}
        >
          {saving ? (
            <>
              <Spinner /> Salvando…
            </>
          ) : !dirty ? (
            <>
              <Check size={20} strokeWidth={2.6} /> Tudo salvo
            </>
          ) : existing ? (
            'Atualizar registro'
          ) : (
            'Salvar registro'
          )}
        </button>
      </div>
    </form>
  );
}
