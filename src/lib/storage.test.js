import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { createEntryStore } from './storage.js';

const BASE = 'https://fake.firebaseio.test';
const PREFIX = `${BASE}/users/eu/entries`;

// Firebase falso em memória, com interruptor de conexão.
function fakeFirebase(initial = {}) {
  const db = { ...initial };
  const calls = [];
  const fake = {
    db,
    calls,
    online: true,
    async fetch(url, { method = 'GET', body } = {}) {
      calls.push(`${method} ${url.replace(BASE, '')}`);
      if (!fake.online) throw new TypeError('Failed to fetch');
      const ok = (data) => ({ ok: true, status: 200, json: async () => data });
      if (url === `${PREFIX}.json`) return ok(Object.keys(db).length ? { ...db } : null);
      const id = decodeURIComponent(url.slice(PREFIX.length + 1, -'.json'.length));
      if (method === 'PUT') db[id] = JSON.parse(body);
      if (method === 'DELETE') delete db[id];
      return ok(null);
    },
  };
  return fake;
}

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
  };
}

const entry = (id, date, fields = {}) => ({ id, date, diet: true, ...fields });

let firebase;
let storage;
let store;

beforeEach(() => {
  firebase = fakeFirebase({ a: entry('a', '2026-01-02'), b: entry('b', '2026-01-01') });
  storage = memoryStorage();
  store = createEntryStore({ baseUrl: BASE, userId: 'eu', storage, fetchImpl: firebase.fetch });
});

test('load baixa e ordena os registros por data', async () => {
  const { entries, status } = await store.load();
  assert.deepEqual(entries.map((e) => e.id), ['b', 'a']);
  assert.equal(status, 'synced');
});

test('save grava só o registro alterado, sem regravar a coleção', async () => {
  await store.load();
  await store.save(entry('c', '2026-01-03'));
  assert.deepEqual(firebase.calls.slice(-1), ['PUT /users/eu/entries/c.json']);
  assert.deepEqual(Object.keys(firebase.db).sort(), ['a', 'b', 'c']);
});

test('registros criados em outro aparelho não são apagados por uma cópia antiga', async () => {
  await store.load();
  firebase.db.outro = entry('outro', '2026-01-05'); // criado em outro aparelho
  await store.save(entry('c', '2026-01-03'));
  await store.remove('a');
  assert.deepEqual(Object.keys(firebase.db).sort(), ['b', 'c', 'outro']);
});

test('sem conexão, alterações ficam na fila e são enviadas depois', async () => {
  await store.load();
  firebase.online = false;

  const saved = await store.save(entry('c', '2026-01-03'));
  assert.equal(saved.synced, false);
  assert.equal(saved.status, 'pending');
  await store.remove('a');
  assert.equal(store.pendingCount(), 2);

  // Recarregar offline mantém as alterações locais.
  const offline = await store.load();
  assert.equal(offline.status, 'offline');
  assert.deepEqual(offline.entries.map((e) => e.id), ['b', 'c']);

  // Uma nova sessão (página recarregada) com a conexão de volta envia a fila.
  firebase.online = true;
  const reopened = createEntryStore({ baseUrl: BASE, userId: 'eu', storage, fetchImpl: firebase.fetch });
  const online = await reopened.load();
  assert.equal(online.status, 'synced');
  assert.equal(reopened.pendingCount(), 0);
  assert.deepEqual(Object.keys(firebase.db).sort(), ['b', 'c']);
  assert.deepEqual(online.entries.map((e) => e.id), ['b', 'c']);
});

test('gravação bem-sucedida descarta operação antiga do mesmo registro na fila', async () => {
  await store.load();
  firebase.online = false;
  await store.save(entry('a', '2026-01-02', { diet: false }));
  firebase.online = true;
  await store.save(entry('a', '2026-01-02', { diet: true, cheatMeal: true }));
  assert.equal(store.pendingCount(), 0);
  assert.equal(firebase.db.a.cheatMeal, true);
});

test('usa a chave do Firebase como id e ignora nós inválidos', async () => {
  firebase.db.semId = { date: '2026-01-04', diet: true };
  firebase.db.lixo = 'texto solto';
  const { entries } = await store.load();
  assert.deepEqual(entries.map((e) => e.id), ['b', 'a', 'semId']);
});

test('banco vazio retorna lista vazia', async () => {
  const empty = createEntryStore({ baseUrl: BASE, userId: 'eu', storage: memoryStorage(), fetchImpl: fakeFirebase().fetch });
  const { entries, status } = await empty.load();
  assert.deepEqual(entries, []);
  assert.equal(status, 'synced');
});
