// Datas dos registros são strings locais no formato AAAA-MM-DD.
// Nunca usar toISOString() para obter "hoje": ele converte para UTC e,
// no horário de Brasília, vira o dia seguinte a partir das 21h.

const pad = (n) => String(n).padStart(2, '0');

export const toISODate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayISO = () => toISODate(new Date());

// Meio-dia evita que fuso ou horário de verão empurrem a data para o dia vizinho.
export const parseISODate = (s) => new Date(`${s}T12:00:00`);

export const addDays = (s, days) => {
  const d = parseISODate(s);
  d.setDate(d.getDate() + days);
  return toISODate(d);
};

// Semanas começam no domingo.
export const startOfWeek = (s) => {
  const d = parseISODate(s);
  d.setDate(d.getDate() - d.getDay());
  return toISODate(d);
};

export const formatDayMonth = (s) =>
  parseISODate(s).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

export const formatFull = (s) => parseISODate(s).toLocaleDateString('pt-BR');

export const formatWeekday = (s) =>
  parseISODate(s).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });

export const formatMonth = (s) => {
  const label = parseISODate(s).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

export const relativeDayLabel = (s, today = todayISO()) => {
  if (s === today) return 'Hoje';
  if (s === addDays(today, -1)) return 'Ontem';
  return null;
};
