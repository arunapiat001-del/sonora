# SONORA — panduan Termux (dari nol)

## 1. Persiapan
Install Termux dari **F-Droid** (versi Play Store sudah usang). Lalu:
```
pkg update -y && pkg upgrade -y
pkg install -y nodejs git unzip
node -v && npm -v && git --version
termux-setup-storage
```
## 2. Ambil project
Simpan `sonora.zip` ke folder Download, lalu:
```
cd ~ && unzip ~/storage/downloads/sonora.zip && cd sonora
npm install
```
## 3. Jalankan
```
npm run dev
```
Buka `http://localhost:5173` di Chrome Android. Uji: cari "blinding lights" → pilih kartu → ketuk THIS IS MY SONG → cek dashboard, lalu buka History.

## 4. Build
```
npm run build
```
Hasil di folder `dist/`. Jika error `EACCES` atau `esbuild`, jalankan `rm -rf node_modules package-lock.json && npm install`.

## 5. GitHub
```
git init && git add . && git commit -m "SONORA v1"
git branch -M main
git remote add origin https://github.com/USERNAME/sonora.git
git push -u origin main
```
(Password GitHub diganti Personal Access Token: GitHub → Settings → Developer settings → Tokens.)

## 6. Netlify
Netlify → Add new site → Import from Git → pilih repo. Build command `npm run build`, publish directory `dist`, functions directory `netlify/functions` (sudah di `netlify.toml`). Tidak ada environment variable wajib. Deploy, lalu buka URL `*.netlify.app`.

## Catatan
- Pencarian memakai iTunes (tanpa key); Deezer lewat `/.netlify/functions/music-search` hanya jalan setelah deploy di Netlify.
- Rating = estimasi metadata. Modul audio (BPM, RMS, dll.) belum ada dan tidak dipalsukan.
