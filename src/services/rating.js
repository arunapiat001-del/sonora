// Semua skor di sini ESTIMASI dari metadata (genre, durasi, tahun, ID). Bukan hasil mendengarkan audio.
export const CATS = [
  ['atmosphere', 'Musical Atmosphere', .15], ['vibes', 'Musical Vibes', .15], ['vocal', 'Vocal', .15],
  ['instrumental', 'Instrumental', .10], ['production', 'Production', .15], ['composition', 'Composition', .10],
  ['listening', 'Listening Experience', .15], ['identity', 'Overall Identity', .05]
];
const MOODS = [
  [/pop/i, ['Hopeful', 'Energetic']], [/rock|metal|punk/i, ['Energetic', 'Aggressive']], [/hip|rap/i, ['Energetic', 'Dark']],
  [/r&b|soul/i, ['Romantic', 'Emotional']], [/jazz|blues/i, ['Chill', 'Nostalgic']], [/classical|piano|instrumental/i, ['Peaceful', 'Emotional']],
  [/electro|dance|house|techno/i, ['Euphoric', 'Energetic']], [/indie|alternative|folk|singer/i, ['Melancholic', 'Dreamy']],
  [/country/i, ['Nostalgic', 'Hopeful']], [/reggae/i, ['Chill', 'Happy']], [/ambient|lo-fi|new age/i, ['Peaceful', 'Dreamy']]
];
function seed(str) { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 1000) / 1000; }; }
const r1 = (n) => Math.round(Math.min(10, Math.max(0, n)) * 10) / 10;
export function label(s) { return s >= 9.5 ? 'Exceptional' : s >= 9 ? 'Outstanding' : s >= 8 ? 'Excellent' : s >= 7 ? 'Very Good' : s >= 6 ? 'Good' : s >= 5 ? 'Average' : s >= 4 ? 'Below Average' : 'Weak'; }
// Bobot dihitung ulang otomatis bila ada kategori tanpa nilai.
export function overall(cats) {
  let tot = 0, w = 0;
  CATS.forEach(([k, , wt]) => { if (typeof cats[k] === 'number') { tot += cats[k] * wt; w += wt; } });
  return w ? r1(tot / w) : 0;
}
export function analyze(song) {
  const rnd = seed(song.id + song.title + song.artist);
  const mins = song.durationMs / 60000;
  const durBonus = mins >= 2.5 && mins <= 5 ? .3 : mins > 7 ? -.2 : 0;
  const age = song.year ? new Date().getFullYear() - +song.year : 0;
  const ageBonus = Math.min(age / 40, .5);
  const moods = (MOODS.find(m => m[0].test(song.genre)) || [0, ['Emotional', 'Chill']])[1];
  const cats = {};
  CATS.forEach(([k]) => { cats[k] = r1(6.2 + rnd() * 2.6 + durBonus + (k === 'listening' || k === 'identity' ? ageBonus : 0)); });
  const vibes = {};
  ['Night drive', 'Morning', 'Rainy day', 'Late night', 'Relaxing', 'Focus', 'Party', 'Nostalgia'].forEach(k => { vibes[k] = r1(5.8 + rnd() * 3.2); });
  const score = overall(cats);
  const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);
  return { cats, vibes, moods, intensity: r1(5 + rnd() * 4.5), score, verdict: label(score), strongest: sorted.slice(0, 2).map(x => x[0]), weakest: sorted.slice(-2).map(x => x[0]), at: Date.now() };
}
const nm = Object.fromEntries(CATS.map(c => [c[0], c[1]]));
export function review(song, a) {
  const [m1, m2] = a.moods, yr = song.year ? ` (${song.year})` : '';
  const top = Object.entries(a.vibes).sort((x, y) => y[1] - x[1])[0][0].toLowerCase();
  return [
    ['General Impression', `"${song.title}" oleh ${song.artist}${yr} mendapat ${a.score}/10 (${a.verdict}) dalam estimasi SONORA.`],
    ['Musical Identity', `Metadata menempatkan lagu ini di genre ${song.genre || 'yang tidak tercatat'}, dari rilisan "${song.album}". Durasi ${fmt(song.durationMs)}.`],
    ['Atmosphere & Vibes', `Karakter yang diperkirakan dari genre: ${m1} dengan sentuhan ${m2}, intensitas ${a.intensity}/10. Paling cocok untuk suasana ${top}.`],
    ['Vocal, Instrumental & Production', 'Tidak ada audio yang diproses, jadi bagian ini hanya estimasi dari metadata, bukan hasil pengukuran.'],
    ['Strongest Elements', a.strongest.map(k => `${nm[k]} (${a.cats[k]})`).join(', ')],
    ['Weakest Elements', a.weakest.map(k => `${nm[k]} (${a.cats[k]})`).join(', ')],
    ['Final Verdict', `${a.verdict}. Penilaian lebih akurat butuh modul analisis audio, yang bisa ditambahkan di tahap berikutnya.`]
  ];
}
const fmt = (ms) => { const s = Math.round(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
