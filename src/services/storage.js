const get = (k) => { try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; } };
const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));
export const history = {
  all: () => get('sonora.history'),
  save(entry) { const a = this.all().filter(e => e.song.id !== entry.song.id); a.unshift(entry); set('sonora.history', a.slice(0, 100)); },
  find: (id) => get('sonora.history').find(e => e.song.id === id),
  clear: () => set('sonora.history', [])
};
export const favorites = {
  all: () => get('sonora.fav'),
  has: (id) => get('sonora.fav').some(s => s.id === id),
  toggle(song) { const a = this.all(); const i = a.findIndex(s => s.id === song.id); i >= 0 ? a.splice(i, 1) : a.push(song); set('sonora.fav', a); return i < 0; }
};
