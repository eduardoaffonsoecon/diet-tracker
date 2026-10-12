import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addDays, relativeDayLabel, startOfWeek, toISODate } from './dates.js';

test('toISODate usa a data local, não UTC', () => {
  // 22h30 em Brasília já é dia 11 em UTC.
  const lateEvening = new Date(2026, 0, 10, 22, 30);
  assert.equal(toISODate(lateEvening), '2026-01-10');
});

test('addDays atravessa meses e anos', () => {
  assert.equal(addDays('2026-01-31', 1), '2026-02-01');
  assert.equal(addDays('2026-01-01', -1), '2025-12-31');
});

test('startOfWeek volta para o domingo', () => {
  assert.equal(startOfWeek('2026-01-10'), '2026-01-04'); // sábado
  assert.equal(startOfWeek('2026-01-04'), '2026-01-04'); // domingo
});

test('relativeDayLabel', () => {
  assert.equal(relativeDayLabel('2026-01-10', '2026-01-10'), 'Hoje');
  assert.equal(relativeDayLabel('2026-01-09', '2026-01-10'), 'Ontem');
  assert.equal(relativeDayLabel('2026-01-08', '2026-01-10'), null);
});
