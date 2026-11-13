import './style.css';
import { searchSongs, fmtDur } from './services/search.js';
import { analyze, review, CATS, label, overall } from './services/rating.js';
import { history, favorites } from './services/storage.js';

const $app = document.getElementById('app'), $nav = document.getElementById('nav');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let results = [], lastQuery = '';
const NAV = [['#/', 'Home'], ['#/history', 'History'], ['#/compare', 'Compare'], ['#/favorites', 'Favorites'], ['#/settings', 'About']];
const img = (s, cls = '') => s.cover ? `<img class="${cls}" src="${esc(s.cover)}" alt="Cover ${esc(s.album)}" loading="lazy">` : '<div class="ph"></div>';

function songCard(s, action) {
  return `<div class="card song">${img(s)}<div style="flex:1;min-width:0"><h3>${esc(s.title)}</h3><div class="meta">${esc(s.artist)}</div><div class="meta">${esc(s.album)} · ${esc(s.year || '–')} · ${fmtDur(s.durationMs)}</div><span class="tag">${esc(s.type)}</span>${s.genre ? `<span class="tag">${esc(s.genre)}</span>` : ''}${action || ''}</div></div>`;
}
function radar(cats) {
  const n = CATS.length, c = 120, R = 90;
  const pt = (i, v) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [c + Math.cos(a) * R * v / 10, c + Math.sin(a) * R * v / 10]; };
  const poly = CATS.map(([k], i) => pt(i, cats[k]).join(',')).join(' ');
  const grid = [2.5, 5, 7.5, 10].map(v => `<polygon points="${CATS.map((_, i) => pt(i, v).join(',')).join(' ')}" fill="none" stroke="#232d57"/>`).join('');
  const dots = CATS.map(([k, name], i) => { const [x, y] = pt(i, 11.6); return `<text x="${x}" y="${y}" fill="#8b93bd" font-size="8" text-anchor="middle">${name.split(' ')[0]}</text>`; }).join('');
  return `<svg viewBox="0 0 240 240" width="100%" role="img" aria-label="Radar chart">${grid}<polygon points="${poly}" fill="#8b5cf655" stroke="#c4b5fd" stroke-width="2"/>${dots}</svg>`;
}
const bars = (items) => items.map(([n, v]) => `<div class="lbl"><span>${esc(n)}</span><b>${v.toFixed(1)}</b></div><div class="bar"><i data-w="${v * 10}"></i></div>`).join('');
const animate = () => requestAnimationFrame(() => setTimeout(() => document.querySelectorAll('.bar i').forEach(e => e.style.width = e.dataset.w + '%'), 50));

function home() {
  $app.innerHTML = `<h1>SONORA</h1><p class="sub">Cari lagu, pilih yang benar dari cover albumnya, lalu dapatkan rating dan review.</p>
  <form class="row" id="f"><input id="q" type="search" placeholder="Judul lagu atau nama artist" value="${esc(lastQuery)}" autocomplete="off" aria-label="Cari lagu"><button>Cari</button></form><div id="out"></div>`;
  const out = document.getElementById('out');
  const show = () => { out.innerHTML = results.length ? `<h2>Pilih lagu yang benar</h2>` + results.map((s, i) => songCard(s, `<div style="margin-top:8px"><button data-i="${i}">THIS IS MY SONG</button></div>`)).join('') : ''; };
  show();
  out.onclick = (e) => { const i = e.target.dataset.i; if (i !== undefined) { sessionStorage.setItem('sonora.sel', JSON.stringify(results[i])); location.hash = '#/analyzing'; } };
  document.getElementById('f').onsubmit = async (e) => {
    e.preventDefault(); const q = document.getElementById('q').value.trim(); if (!q) return;
    lastQuery = q; out.innerHTML = '<div class="spin" role="status" aria-label="Memuat"></div>';
    try { results = await searchSongs(q); out.innerHTML = results.length ? '' : `<div class="empty">Tidak ada hasil untuk "${esc(q)}". Coba judul lain atau tambahkan nama artist.</div>`; if (results.length) show(); }
    catch (err) { out.innerHTML = `<div class="err">${esc(err.message)}</div>`; }
  };
}
function analyzing() {
  const s = JSON.parse(sessionStorage.getItem('sonora.sel') || 'null'); if (!s) return (location.hash = '#/');
  $app.innerHTML = `<div class="empty"><div class="spin"></div>Menganalisis "${esc(s.title)}"…</div>`;
  setTimeout(() => { const a = analyze(s); history.save({ song: s, a }); location.hash = '#/result/' + encodeURIComponent(s.id); }, 1100);
}
function result(id) {
  const e = history.find(decodeURIComponent(id)); if (!e) return (location.hash = '#/');
  const { song: s, a } = e, fav = favorites.has(s.id), rev = review(s, a);
  $app.innerHTML = `<div class="hero">${img(s)}<div class="big">${a.score.toFixed(1)}</div><b>${a.verdict}</b><h2 style="margin:8px 0 2px">${esc(s.title)}</h2><div class="meta">${esc(s.artist)} · ${esc(s.album)}</div><div class="meta">${esc(s.year || '–')} · ${fmtDur(s.durationMs)} · ${esc(s.genre || 'Genre tidak tercatat')}</div>
  <div>${a.moods.map(m => `<span class="tag">${m}</span>`).join('')}</div></div>
  <div class="note">Skor ini estimasi dari metadata (genre, durasi, tahun). Audio tidak dianalisis.</div>
  <div class="row"><button id="fav" class="ghost">${fav ? '★ Hapus favorit' : '☆ Favorit'}</button><button id="copy" class="ghost">Salin review</button><button id="share" class="ghost">Bagikan</button></div>
  <h2>Rating kategori</h2><div class="card">${bars(CATS.map(([k, n]) => [n, a.cats[k]]))}</div>
  <div class="card">${radar(a.cats)}</div><h2>Vibes</h2><div class="card">${bars(Object.entries(a.vibes))}</div>
  <h2>Review</h2>${rev.map(([t, b]) => `<div class="card"><b>${t}</b><p class="meta" style="font-size:.95rem">${esc(b)}</p></div>`).join('')}`;
  animate();
  const text = `${s.title} – ${s.artist}\nSONORA: ${a.score}/10 (${a.verdict})\n\n` + rev.map(([t, b]) => `${t}: ${b}`).join('\n');
  document.getElementById('fav').onclick = () => { favorites.toggle(s); result(id); };
  document.getElementById('copy').onclick = async (ev) => { try { await navigator.clipboard.writeText(text); ev.target.textContent = 'Tersalin'; } catch { prompt('Salin teks ini:', text); } };
  document.getElementById('share').onclick = () => navigator.share ? navigator.share({ title: 'SONORA', text }).catch(() => {}) : alert('Browser ini tidak mendukung berbagi. Gunakan "Salin review".');
}
function historyPage() {
  const h = history.all();
  $app.innerHTML = `<h1>History</h1>` + (h.length ? h.map(e => `<a href="#/result/${encodeURIComponent(e.song.id)}" style="text-decoration:none;color:inherit">${songCard(e.song, `<div style="margin-top:6px"><b style="color:var(--acc2)">${e.a.score.toFixed(1)}</b> <span class="meta">· ${new Date(e.a.at).toLocaleDateString('id-ID')}</span></div>`)}</a>`).join('') + '<button class="ghost" id="clr">Hapus semua riwayat</button>' : '<div class="empty">Belum ada riwayat. Cari lagu di Home untuk mulai.</div>');
  const c = document.getElementById('clr'); if (c) c.onclick = () => { if (confirm('Hapus semua riwayat?')) { history.clear(); historyPage(); } };
}
function favPage() {
  const f = favorites.all();
  $app.innerHTML = `<h1>Favorites</h1>` + (f.length ? f.map((s, i) => songCard(s, `<div class="row" style="margin-top:8px"><button class="ghost" data-r="${i}">Hapus</button></div>`)).join('') : '<div class="empty">Belum ada favorit. Buka hasil rating lalu ketuk Favorit.</div>');
  $app.onclick = (e) => { const i = e.target.dataset.r; if (i !== undefined) { favorites.toggle(f[i]); favPage(); } };
}
function compare() {
  const h = history.all();
  if (h.length < 2) { $app.innerHTML = '<h1>Compare</h1><div class="empty">Butuh minimal 2 lagu di History. Rating dua lagu dulu.</div>'; return; }
  const opts = (sel) => h.map((e, i) => `<option value="${i}" ${i === sel ? 'selected' : ''}>${esc(e.song.title)} – ${esc(e.song.artist)}</option>`).join('');
  $app.innerHTML = `<h1>Compare</h1><div class="row" style="margin:14px 0"><select id="a">${opts(0)}</select><select id="b">${opts(1)}</select></div><div id="r"></div>`;
  const draw = () => {
    const A = h[document.getElementById('a').value], B = h[document.getElementById('b').value];
    const rows = [['Overall', A.a.score, B.a.score], ...CATS.map(([k, n]) => [n, A.a.cats[k], B.a.cats[k]])];
    document.getElementById('r').innerHTML = `<div class="card"><div class="cmp"><b>${esc(A.song.title)}</b><span></span><b>${esc(B.song.title)}</b>${rows.map(([n, x, y]) => `<span class="${x > y ? 'win' : ''}">${x.toFixed(1)}</span><span class="meta">${n}</span><span class="${y > x ? 'win' : ''}">${y.toFixed(1)}</span>`).join('')}</div></div>`;
  };
  document.getElementById('a').onchange = document.getElementById('b').onchange = draw; draw();
}
function about() {
  $app.innerHTML = `<h1>About</h1><p class="sub">SONORA mengambil metadata dari iTunes Search API (fallback Deezer lewat Netlify Function). Rating dan review adalah estimasi dari metadata, bukan hasil mendengarkan audio.</p><div class="card">Data tersimpan di perangkat ini (localStorage). Tidak ada akun dan tidak ada API key di browser.</div><button class="ghost" id="clr">Hapus semua data</button>`;
  document.getElementById('clr').onclick = () => { if (confirm('Hapus riwayat dan favorit?')) { localStorage.clear(); about(); } };
}
function route() {
  const h = location.hash || '#/';
  $app.onclick = null;
  $nav.innerHTML = NAV.map(([href, n]) => `<a href="${href}" class="${h === href || (href === '#/' && /analyzing|result/.test(h)) ? 'on' : ''}">${n}</a>`).join('');
  if (h.startsWith('#/result/')) return result(h.slice(9));
  ({ '#/': home, '#/analyzing': analyzing, '#/history': historyPage, '#/compare': compare, '#/favorites': favPage, '#/settings': about }[h] || home)();
  window.scrollTo(0, 0);
}
addEventListener('hashchange', route); route();
