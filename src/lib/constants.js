export const CHEAT_LIMIT_PER_WEEK = 2;

export const EXERCISE_TYPES = [
  { value: 'Caminhada', label: 'Caminhada' },
  { value: 'Musculação', label: 'Musculação' },
];

export const EXERCISE_DURATIONS = [
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hora' },
];

export const SLEEP_OPTIONS = [
  { value: '<6h', label: '< 6h', hint: 'Sono insuficiente' },
  { value: '6-8h', label: '6-8h', hint: 'Sono adequado' },
  { value: '>8h', label: '> 8h', hint: 'Sono excelente' },
];

export const STUDY_OPTIONS = [
  { value: '<2h', label: '< 2h', hours: 1 },
  { value: '2-4h', label: '2-4h', hours: 3 },
  { value: '>4h', label: '> 4h', hours: 5 },
];

export const SLEEP_OK = ['6-8h', '>8h'];

export const RANGE_OPTIONS = [
  { value: 7, label: '7d' },
  { value: 14, label: '14d' },
  { value: 30, label: '30d' },
  { value: 60, label: '60d' },
  { value: 'all', label: 'Tudo' },
];
