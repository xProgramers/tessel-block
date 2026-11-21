// localStorage em memória para os testes (o Node não tem um por padrão).
import { beforeEach } from 'vitest';
import { setLang } from '../src/i18n';

class MemoryStorage {
  #m = new Map();
  getItem(k) { return this.#m.has(k) ? this.#m.get(k) : null; }
  setItem(k, v) { this.#m.set(k, String(v)); }
  removeItem(k) { this.#m.delete(k); }
  clear() { this.#m.clear(); }
  key(i) { return [...this.#m.keys()][i] ?? null; }
  get length() { return this.#m.size; }
}

globalThis.localStorage = new MemoryStorage();
beforeEach(() => {
  localStorage.clear();
  setLang('pt'); // os testes existentes conferem os textos em português
});
