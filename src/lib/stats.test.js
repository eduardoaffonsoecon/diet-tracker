import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dietStreak, filterByRange, summarize, toChartData, weeklyCheats } from './stats.js';

const entry = (date, fields = {}) => ({
  id: date,
  date,
  diet: true,
  exercise: null,
  exerciseMinutes: 0,
  sleepCategory: '',
  cheatMeal: false,
  cheatMealDesc: null,
  studied: false,
  studyHours: null,
  ...fields,
});

test('filterByRange: 7 dias são hoje e os 6 anteriores', () => {
  const entries = ['2026-01-03', '2026-01-04', '2026-01-10', '2026-01-11'].map((d) => entry(d));
  const dates = filterByRange(entries, 7, '2026-01-10').map((e) => e.date);
  assert.deepEqual(dates, ['2026-01-04', '2026-01-10']);
  assert.equal(filterByRange(entries, 'all', '2026-01-10').length, 4);
});

test('summarize calcula médias só sobre os dias com a atividade', () => {
  const stats = summarize([
    entry('2026-01-01', { exercise: 'Caminhada', exerciseMinutes: 30, sleepCategory: '6-8h', studied: true, studyHours: '<2h' }),
    entry('2026-01-02', { exercise: 'Musculação', exerciseMinutes: 60, sleepCategory: '<6h', studied: true, studyHours: '>4h' }),
    entry('2026-01-03', { diet: false, sleepCategory: '>8h' }),
    entry('2026-01-04'),
  ]);
  assert.equal(stats.total, 4);
  assert.equal(stats.dietDays, 3);
  assert.equal(stats.exerciseDays, 2);
  assert.equal(stats.avgExerciseMinutes, 45);
  assert.equal(stats.studyDays, 2);
  assert.equal(stats.avgStudyHours, 3);
  assert.equal(stats.sleepOkDays, 2);
  assert.deepEqual(stats.sleepByCategory, { '<6h': 1, '6-8h': 1, '>8h': 1 });
  assert.deepEqual(stats.studyByCategory, { '<2h': 1, '2-4h': 0, '>4h': 1 });
});

test('summarize sem registros não divide por zero', () => {
  const stats = summarize([]);
  assert.equal(stats.avgExerciseMinutes, 0);
  assert.equal(stats.avgStudyHours, 0);
});

test('weeklyCheats agrupa por semana (domingo a sábado) e aplica o limite', () => {
  const result = weeklyCheats([
    entry('2026-01-04', { cheatMeal: true, cheatMealDesc: 'Pizza' }),
    entry('2026-01-06', { cheatMeal: true, cheatMealDesc: 'Hambúrguer' }),
    entry('2026-01-08', { cheatMeal: true }),
    entry('2026-01-11'),
  ]);
  assert.equal(result.totalWeeks, 2);
  assert.deepEqual(result.weeks[0], {
    weekStart: '2026-01-04',
    weekEnd: '2026-01-10',
    cheats: 3,
    details: ['Pizza', 'Hambúrguer'],
  });
  assert.equal(result.weeks[1].cheats, 0);
  assert.equal(result.weeksOk, 1);
  assert.equal(result.avgPerWeek, 1.5);
});

test('dietStreak conta dias seguidos e para em falha ou dia sem registro', () => {
  const entries = [
    entry('2026-01-05'),
    entry('2026-01-07', { diet: false }),
    entry('2026-01-08'),
    entry('2026-01-09'),
  ];
  // Hoje (10) ainda sem registro: conta a partir de ontem.
  assert.equal(dietStreak(entries, '2026-01-10'), 2);
  assert.equal(dietStreak([...entries, entry('2026-01-10')], '2026-01-10'), 3);
  assert.equal(dietStreak([...entries, entry('2026-01-10', { diet: false })], '2026-01-10'), 0);
  assert.equal(dietStreak([entry('2026-01-05')], '2026-01-10'), 0);
});

test('toChartData não transforma sono vazio em "> 8h"', () => {
  const [withSleep, withoutSleep] = toChartData([
    entry('2026-01-01', { sleepCategory: '<6h' }),
    entry('2026-01-02', { sleepCategory: '' }),
  ]);
  assert.equal(withSleep.sleepValue, 5);
  assert.equal(withoutSleep.sleepValue, null);
});
