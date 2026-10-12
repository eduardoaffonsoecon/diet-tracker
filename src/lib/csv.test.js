import assert from 'node:assert/strict';
import { test } from 'node:test';
import { entriesToCSV } from './csv.js';

test('entriesToCSV escapa aspas e preenche campos vazios', () => {
  const csv = entriesToCSV([
    {
      date: '2026-01-10',
      diet: false,
      exercise: null,
      exerciseMinutes: 0,
      sleepCategory: '',
      studied: false,
      studyHours: null,
      cheatMeal: true,
      cheatMealDesc: 'Pizza "quatro queijos", com borda',
    },
  ]);
  const [header, row] = csv.split('\n');
  assert.equal(header.split(',').length, 9);
  assert.equal(row, '"2026-01-10","Não","","0","","Não","","Sim","Pizza ""quatro queijos"", com borda"');
});
