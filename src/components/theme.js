import { BookOpen, Dumbbell, Footprints, Moon, Pizza, Salad } from 'lucide-react';

// Cada hábito tem uma cor própria, usada em todas as telas.
// As classes precisam aparecer por extenso para o Tailwind gerá-las.
export const HABITS = {
  diet: {
    label: 'Dieta',
    Icon: Salad,
    hex: '#34d399',
    text: 'text-emerald-400',
    badge: 'bg-emerald-400/15 text-emerald-300',
    solid: 'bg-emerald-400 text-zinc-950',
  },
  exercise: {
    label: 'Exercício',
    Icon: Dumbbell,
    hex: '#38bdf8',
    text: 'text-sky-400',
    badge: 'bg-sky-400/15 text-sky-300',
    solid: 'bg-sky-400 text-zinc-950',
  },
  sleep: {
    label: 'Sono',
    Icon: Moon,
    hex: '#a78bfa',
    text: 'text-violet-400',
    badge: 'bg-violet-400/15 text-violet-300',
    solid: 'bg-violet-400 text-zinc-950',
  },
  study: {
    label: 'Estudo',
    Icon: BookOpen,
    hex: '#fbbf24',
    text: 'text-amber-400',
    badge: 'bg-amber-400/15 text-amber-300',
    solid: 'bg-amber-400 text-zinc-950',
  },
  cheat: {
    label: 'Refeição livre',
    Icon: Pizza,
    hex: '#fb7185',
    text: 'text-rose-400',
    badge: 'bg-rose-400/15 text-rose-300',
    solid: 'bg-rose-400 text-zinc-950',
  },
};

export const EXERCISE_ICONS = { Caminhada: Footprints, Musculação: Dumbbell };

// Cores por faixa de sono: pouco sono em alerta, o resto em tons de roxo.
export const SLEEP_TONES = {
  '<6h': { hex: '#fb7185', text: 'text-rose-400', solid: 'bg-rose-400 text-zinc-950' },
  '6-8h': { hex: '#a78bfa', text: 'text-violet-400', solid: 'bg-violet-400 text-zinc-950' },
  '>8h': { hex: '#818cf8', text: 'text-indigo-400', solid: 'bg-indigo-400 text-zinc-950' },
};

export const STUDY_TONES = {
  '<2h': { hex: '#fde68a', text: 'text-amber-200' },
  '2-4h': { hex: '#fbbf24', text: 'text-amber-400' },
  '>4h': { hex: '#f59e0b', text: 'text-amber-500' },
};
