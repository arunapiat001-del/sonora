const timeout = (ms) => { const c = new AbortController(); setTimeout(() => c.abort(), ms); return c.signal; };
async function itunes(q) {
  const r = await fetch('https://itunes.apple.com/search?media=music&entity=song&limit=15&term=' + encodeURIComponent(q), { signal: timeout(8000) });
  if (!r.ok) throw new Error('iTunes ' + r.status);
  const d = await r.json();
  return d.results.map(x => ({
    id: 'it' + x.trackId, title: x.trackName, artist: x.artistName, album: x.collectionName,
    cover: (x.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
    year: (x.releaseDate || '').slice(0, 4), durationMs: x.trackTimeMillis || 0, genre: x.primaryGenreName || '',
    type: /single/i.test(x.collectionName || '') ? 'Single' : 'Album track',
    explicit: x.trackExplicitness === 'explicit', source: 'iTunes'
  }));
}
async function deezer(q) {
  const r = await fetch('/.netlify/functions/music-search?q=' + encodeURIComponent(q), { signal: timeout(9000) });
  if (!r.ok) throw new Error('Deezer fallback ' + r.status);
  return (await r.json()).results;
}
export async function searchSongs(q) {
  try { const a = await itunes(q); if (a.length) return a; } catch (e) { console.warn(e); }
  try { return await deezer(q); } catch (e) { console.warn(e); }
  throw new Error('Semua sumber metadata gagal. Cek koneksi internet lalu coba lagi.');
}
export const fmtDur = (ms) => { if (!ms) return '–'; const s = Math.round(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
