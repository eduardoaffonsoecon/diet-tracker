import { BarChart3, CircleAlert, CircleCheck, CloudCheck, CloudOff, CloudUpload, Flame, History, Leaf, PlusCircle } from 'lucide-react';
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FIREBASE_DATABASE_URL, USER_ID } from './config.js';
import EntryForm from './components/EntryForm.jsx';
import HistoryView from './components/HistoryView.jsx';
import { Card, Spinner, cx } from './components/ui.jsx';
import { formatFull, todayISO } from './lib/dates.js';
import { dietStreak } from './lib/stats.js';
import { createEntryStore } from './lib/storage.js';

// O relatório carrega o Recharts, que é pesado: só baixa quando a aba é aberta.
const ReportView = lazy(() => import('./components/ReportView.jsx'));

const store = createEntryStore({ baseUrl: FIREBASE_DATABASE_URL, userId: USER_ID });

const TABS = [
  { id: 'input', label: 'Registrar', Icon: PlusCircle },
  { id: 'history', label: 'Histórico', Icon: History },
  { id: 'report', label: 'Relatório', Icon: BarChart3 },
];

// Sincronizado mostra só o ícone; pendente e offline mostram também um texto curto.
const SYNC_BADGES = {
  syncing: { label: 'Sincronizando', short: null, className: 'text-zinc-300', Icon: null },
  synced: { label: 'Sincronizado', short: null, className: 'text-emerald-300', Icon: CloudCheck },
  pending: { label: 'Envio pendente', short: 'Pendente', className: 'text-amber-300', Icon: CloudUpload },
  offline: { label: 'Offline', short: 'Offline', className: 'text-zinc-400', Icon: CloudOff },
};

function SyncButton({ status, pending, onClick, disabled }) {
  const badge = SYNC_BADGES[status];
  const label = status === 'pending' && pending > 1 ? `${pending} envios pendentes` : badge.label;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={`${label} · toque para sincronizar`}
      aria-label={`${label}. Sincronizar agora`}
      className={cx(
        'flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/[0.08] bg-white/[0.04] text-xs font-semibold transition-colors hover:bg-white/[0.08] disabled:cursor-default',
        badge.short ? 'px-3' : 'w-10 justify-center',
        badge.className,
      )}
    >
      {badge.Icon ? <badge.Icon size={18} strokeWidth={2.2} aria-hidden /> : <Spinner size={18} />}
      {badge.short && <span>{status === 'pending' && pending > 1 ? `${pending} pendentes` : badge.short}</span>}
    </button>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  const Icon = toast.tone === 'warning' ? CircleAlert : CircleCheck;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(4.75rem+env(safe-area-inset-top))] z-40 flex justify-center px-4">
      <div
        key={toast.id}
        role="status"
        className={cx(
          'flex max-w-sm items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-2xl backdrop-blur-xl motion-safe:animate-toast-in',
          toast.tone === 'warning'
            ? 'border-amber-400/30 bg-zinc-900/95 text-amber-200'
            : 'border-emerald-400/30 bg-zinc-900/95 text-emerald-200',
        )}
      >
        <Icon size={18} className="shrink-0" aria-hidden />
        {toast.text}
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-zinc-400">
      <span className="grid h-16 w-16 animate-pulse place-items-center rounded-3xl bg-gradient-to-br from-emerald-300 to-teal-500 text-zinc-950 shadow-2xl shadow-emerald-500/30">
        <Leaf size={30} strokeWidth={2.2} />
      </span>
      <p className="text-sm font-medium">Carregando seus dados…</p>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState('input');
  const [entries, setEntries] = useState([]);
  const [status, setStatus] = useState('syncing');
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(todayISO);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((text, tone = 'success') => {
    clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), text, tone });
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const sync = useCallback(async () => {
    setStatus('syncing');
    const result = await store.load();
    setEntries(result.entries);
    setStatus(result.status);
    setLoaded(true);
  }, []);

  useEffect(() => {
    sync();
    // Quando a conexão volta, envia o que ficou pendente.
    window.addEventListener('online', sync);
    return () => window.removeEventListener('online', sync);
  }, [sync]);

  const entriesByDate = useMemo(() => new Map(entries.map((e) => [e.date, e])), [entries]);
  const streak = useMemo(() => dietStreak(entries), [entries]);
  const existing = entriesByDate.get(date);

  const saveEntry = async (fields) => {
    setSaving(true);
    const entry = {
      ...existing,
      ...fields,
      id: existing?.id ?? `${date}-${Date.now()}`,
      date,
      updatedAt: new Date().toISOString(),
    };
    const result = await store.save(entry);
    setEntries(result.entries);
    setStatus(result.status);
    setSaving(false);
    if (result.synced) showToast(existing ? 'Registro atualizado' : 'Registro salvo');
    else showToast('Sem conexão: salvo no aparelho, envio quando a internet voltar', 'warning');
  };

  const deleteEntry = async (entry) => {
    if (!window.confirm(`Excluir o registro de ${formatFull(entry.date)}?`)) return;
    const result = await store.remove(entry.id);
    setEntries(result.entries);
    setStatus(result.status);
    if (result.synced) showToast('Registro excluído');
    else showToast('Sem conexão: exclusão será enviada quando a internet voltar', 'warning');
  };

  const goTo = (tab) => {
    setView(tab);
    window.scrollTo({ top: 0 });
  };

  const editDate = (day) => {
    setDate(day);
    goTo('input');
  };

  if (!loaded) return <LoadingScreen />;

  return (
    <div className="min-h-screen text-zinc-100">
      <header className="sticky top-0 z-30 border-b border-white/[0.05] bg-zinc-950/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-md items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-300 to-teal-500 text-zinc-950 shadow-lg shadow-emerald-500/20">
              <Leaf size={20} strokeWidth={2.4} aria-hidden />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-base font-extrabold leading-tight tracking-tight">Diet Tracker</h1>
              {streak > 0 ? (
                <p className="flex items-center gap-1 truncate text-xs font-medium text-orange-300">
                  <Flame size={13} strokeWidth={2.4} aria-hidden />
                  {streak} {streak === 1 ? 'dia seguido' : 'dias seguidos'} na dieta
                </p>
              ) : (
                <p className="truncate text-xs text-zinc-500">Seus hábitos, dia a dia</p>
              )}
            </div>
          </div>
          <SyncButton
            status={status}
            pending={store.pendingCount()}
            onClick={sync}
            disabled={status === 'syncing' || saving}
          />
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-5">
        {view === 'input' && (
          <EntryForm
            key={`${date}|${existing?.updatedAt ?? existing?.id ?? 'novo'}`}
            date={date}
            existing={existing}
            entriesByDate={entriesByDate}
            onDateChange={setDate}
            onSave={saveEntry}
            saving={saving}
          />
        )}
        {view === 'history' && (
          <HistoryView entries={entries} onEdit={editDate} onDelete={deleteEntry} onStart={() => editDate(todayISO())} />
        )}
        {view === 'report' && (
          <Suspense
            fallback={
              <Card className="flex items-center justify-center gap-2 py-10 text-sm text-zinc-400">
                <Spinner /> Carregando relatório…
              </Card>
            }
          >
            <ReportView entries={entries} userId={USER_ID} />
          </Suspense>
        )}
      </main>

      <Toast toast={toast} />

      <nav
        aria-label="Navegação principal"
        className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-white/[0.06] bg-zinc-950/95 backdrop-blur-xl"
      >
        <div className="mx-auto grid h-16 max-w-md grid-cols-3">
          {TABS.map(({ id, label, Icon }) => {
            const active = view === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => goTo(id)}
                aria-current={active ? 'page' : undefined}
                className={cx(
                  'flex flex-col items-center justify-center gap-1 text-[0.7rem] font-semibold transition-colors',
                  active ? 'text-emerald-300' : 'text-zinc-500 hover:text-zinc-300',
                )}
              >
                <span
                  className={cx(
                    'grid h-7 w-14 place-items-center rounded-full transition-colors',
                    active && 'bg-emerald-400/15',
                  )}
                >
                  <Icon size={20} strokeWidth={active ? 2.4 : 2} aria-hidden />
                </span>
                {label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
