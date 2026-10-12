const HEADERS = ['Data', 'Dieta', 'Exercício', 'Minutos', 'Sono', 'Estudou', 'Horas Estudo', 'Cheat Meal', 'Descrição'];

const yesNo = (value) => (value ? 'Sim' : 'Não');

// Aspas dentro do texto são duplicadas, como manda o formato CSV.
const quote = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export function entriesToCSV(entries) {
  const rows = entries.map((e) => [
    e.date,
    yesNo(e.diet),
    e.exercise || '',
    e.exerciseMinutes || 0,
    e.sleepCategory || '',
    yesNo(e.studied),
    e.studyHours || '',
    yesNo(e.cheatMeal),
    e.cheatMealDesc || '',
  ]);
  return [HEADERS, ...rows].map((row) => row.map(quote).join(',')).join('\n');
}

// O BOM no início faz o Excel reconhecer o UTF-8 e exibir os acentos corretamente.
export function downloadCSV(filename, content) {
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
