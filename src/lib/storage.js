// Persistência dos registros: Firebase Realtime Database (API REST) + cópia no localStorage.
//
// Cada registro é gravado ou excluído individualmente em /users/{userId}/entries/{id}.json.
// Antes, a coleção inteira era regravada a cada alteração, e uma cópia desatualizada
// (aparelho offline ou duas abas abertas) podia apagar registros da nuvem.
//
// Quando a gravação falha, a operação vai para uma fila no localStorage e é reenviada
// na próxima sincronização, em vez de se perder ao recarregar a página.

const CACHE_KEY = 'diet-entries'; // mesmo nome usado pelas versões anteriores
const PENDING_KEY = 'diet-pending';

export const sortByDate = (entries) => [...entries].sort((a, b) => a.date.localeCompare(b.date));

export function createEntryStore({
  baseUrl,
  userId,
  storage = globalThis.localStorage,
  fetchImpl = (...args) => globalThis.fetch(...args),
}) {
  const entriesUrl = `${baseUrl}/users/${encodeURIComponent(userId)}/entries`;
  const entryUrl = (id) => `${entriesUrl}/${encodeURIComponent(id)}.json`;

  let current = [];
  let seq = 0;

  const readJSON = (key, fallback) => {
    try {
      const raw = storage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };
  const writeJSON = (key, value) => {
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch {
      // Armazenamento cheio ou bloqueado (modo privado): segue só com a memória.
    }
  };

  const readPending = () => readJSON(PENDING_KEY, {});
  const writePending = (pending) => writeJSON(PENDING_KEY, pending);
  const setCurrent = (entries) => {
    current = sortByDate(entries);
    writeJSON(CACHE_KEY, current);
    return current;
  };

  async function request(url, options) {
    const response = await fetchImpl(url, options);
    if (!response.ok) throw new Error(`Firebase respondeu ${response.status}`);
    return response;
  }

  const send = (id, op) =>
    op.type === 'delete'
      ? request(entryUrl(id), { method: 'DELETE' })
      : request(entryUrl(id), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(op.entry),
        });

  // Remove da fila a operação enviada, a menos que outra mais nova do mesmo registro
  // tenha entrado enquanto o envio acontecia.
  const dequeue = (id, queuedAt) => {
    const pending = readPending();
    if (pending[id] && (queuedAt === undefined || pending[id].queuedAt === queuedAt)) {
      delete pending[id];
      writePending(pending);
    }
  };

  async function flushPending() {
    for (const [id, op] of Object.entries(readPending())) {
      try {
        await send(id, op);
        dequeue(id, op.queuedAt);
      } catch {
        break; // sem conexão: tenta de novo na próxima sincronização
      }
    }
  }

  const applyPending = (entries) => {
    const byId = new Map(entries.map((e) => [e.id, e]));
    for (const [id, op] of Object.entries(readPending())) {
      if (op.type === 'delete') byId.delete(id);
      else byId.set(id, op.entry);
    }
    return [...byId.values()];
  };

  const pendingCount = () => Object.keys(readPending()).length;
  const status = () => (pendingCount() ? 'pending' : 'synced');

  async function sendOrQueue(id, op) {
    try {
      await send(id, op);
      dequeue(id); // uma operação antiga do mesmo registro ficou obsoleta
      return true;
    } catch {
      const pending = readPending();
      pending[id] = { ...op, queuedAt: `${Date.now()}-${seq++}` };
      writePending(pending);
      return false;
    }
  }

  return {
    pendingCount,

    // Envia o que estiver na fila e baixa a versão da nuvem.
    // Sem conexão, devolve a cópia local.
    async load() {
      await flushPending();
      try {
        const response = await request(`${entriesUrl}.json`);
        const data = (await response.json()) || {};
        const remote = Object.entries(data)
          .filter(([, entry]) => entry && typeof entry.date === 'string')
          .map(([key, entry]) => ({ ...entry, id: key }));
        return { entries: setCurrent(applyPending(remote)), status: status() };
      } catch {
        return { entries: setCurrent(readJSON(CACHE_KEY, [])), status: 'offline' };
      }
    },

    async save(entry) {
      const entries = setCurrent([...current.filter((e) => e.id !== entry.id), entry]);
      const synced = await sendOrQueue(entry.id, { type: 'upsert', entry });
      return { entries, synced, status: synced ? status() : 'pending' };
    },

    async remove(id) {
      const entries = setCurrent(current.filter((e) => e.id !== id));
      const synced = await sendOrQueue(id, { type: 'delete' });
      return { entries, synced, status: synced ? status() : 'pending' };
    },
  };
}
