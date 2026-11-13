// Fallback proxy ke Deezer (Deezer tidak mengizinkan CORS dari browser).
export async function handler(event) {
  const q = (event.queryStringParameters || {}).q;
  if (!q) return { statusCode: 400, body: JSON.stringify({ error: 'Parameter q wajib diisi' }) };
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch('https://api.deezer.com/search?limit=15&q=' + encodeURIComponent(q), { signal: ctrl.signal });
    const d = await r.json();
    const results = (d.data || []).map(x => ({
      id: 'dz' + x.id, title: x.title, artist: x.artist.name, album: x.album.title,
      cover: x.album.cover_xl || x.album.cover_big, year: '', durationMs: x.duration * 1000,
      genre: '', type: 'Track', explicit: !!x.explicit_lyrics, source: 'Deezer'
    }));
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ results }) };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: 'Deezer tidak merespons' }) };
  } finally { clearTimeout(t); }
}
