import { CHEAT_LIMIT_PER_WEEK, SLEEP_OK, SLEEP_OPTIONS, STUDY_OPTIONS } from './constants.js';
import { addDays, startOfWeek, todayISO } from './dates.js';

const sum = (values) => values.reduce((total, v) => total + v, 0);

const countBy = (entries, key, options) =>
  Object.fromEntries(options.map(({ value }) => [value, entries.filter((e) => e[key] === value).length]));

// "Últimos N dias" inclui hoje: 7 dias = hoje e os 6 anteriores.
export function filterByRange(entries, range, today = todayISO()) {
  if (range === 'all') return entries;
  const from = addDays(today, -(range - 1));
  return entries.filter((e) => e.date >= from && e.date <= today);
}

export function summarize(entries) {
  const exerciseEntries = entries.filter((e) => e.exerciseMinutes > 0);
  const studyHours = Object.fromEntries(STUDY_OPTIONS.map((o) => [o.value, o.hours]));
  const studyEntries = entries.filter((e) => e.studied && studyHours[e.studyHours]);
  const sleepByCategory = countBy(entries, 'sleepCategory', SLEEP_OPTIONS);

  return {
    total: entries.length,
    dietDays: entries.filter((e) => e.diet).length,
    exerciseDays: exerciseEntries.length,
    avgExerciseMinutes: exerciseEntries.length
      ? Math.round(sum(exerciseEntries.map((e) => e.exerciseMinutes)) / exerciseEntries.length)
      : 0,
    studyDays: entries.filter((e) => e.studied).length,
    avgStudyHours: studyEntries.length
      ? sum(studyEntries.map((e) => studyHours[e.studyHours])) / studyEntries.length
      : 0,
    sleepByCategory,
    sleepOkDays: sum(SLEEP_OK.map((value) => sleepByCategory[value])),
    studyByCategory: countBy(entries, 'studyHours', STUDY_OPTIONS),
  };
}

// Agrupa as refeições livres por semana. Só entram semanas com algum registro.
export function weeklyCheats(entries, limit = CHEAT_LIMIT_PER_WEEK) {
  const weeks = new Map();
  for (const entry of entries) {
    const weekStart = startOfWeek(entry.date);
    if (!weeks.has(weekStart)) {
      weeks.set(weekStart, { weekStart, weekEnd: addDays(weekStart, 6), cheats: 0, details: [] });
    }
    if (entry.cheatMeal) {
      const week = weeks.get(weekStart);
      week.cheats++;
      if (entry.cheatMealDesc) week.details.push(entry.cheatMealDesc);
    }
  }

  const list = [...weeks.values()].sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  return {
    weeks: list,
    avgPerWeek: list.length ? sum(list.map((w) => w.cheats)) / list.length : 0,
    weeksOk: list.filter((w) => w.cheats <= limit).length,
    totalWeeks: list.length,
  };
}

// Dias seguidos na dieta. Se hoje ainda não foi registrado, conta a partir de ontem.
export function dietStreak(entries, today = todayISO()) {
  const byDate = new Map(entries.map((e) => [e.date, e]));
  let day = byDate.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (byDate.get(day)?.diet) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}

const SLEEP_CHART_VALUE = { '<6h': 5, '6-8h': 7, '>8h': 9 };

// Dias sem sono informado ficam sem barra (null), em vez de aparecer como "> 8h".
export const toChartData = (entries) =>
  entries.map((e) => ({
    date: e.date,
    exercise: e.exercise,
    exerciseMinutes: e.exerciseMinutes || 0,
    sleepCategory: e.sleepCategory,
    sleepValue: SLEEP_CHART_VALUE[e.sleepCategory] ?? null,
  }));
