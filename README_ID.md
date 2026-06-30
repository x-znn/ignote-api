# IGNOTE REST API

API Node.js untuk membuat gambar note/pesan vertikal dinamis dalam format PNG.

## Endpoint

- `GET /docs` — halaman dokumentasi
- `GET /api/health` — status API
- `GET /api/ignote?name=...&text=...&time=...` — hasil PNG
- `GET /api/ignote/json?name=...&text=...&time=...` — hasil JSON dan URL gambar

## Contoh URL

`https://domain-kamu/api/ignote?name=Fauzann&text=Halo%20semua&time=8%20detik&apikey=API_KEY_KAMU`

## Environment variable

Salin `.env.example` menjadi `.env` saat menjalankan lokal.

- `PORT` — port API. Hosting biasanya mengisinya otomatis.
- `API_KEY` — kunci rahasia API. Kosongkan hanya untuk tes lokal.
- `APP_BASE_URL` — opsional. Dipakai endpoint JSON untuk membentuk URL gambar.

## Menjalankan lokal

1. Jalankan `npm install`
2. Buat `.env` dari `.env.example`
3. Jalankan `npm start`
4. Buka `http://localhost:3000/docs`

## Deploy

Proyek sudah memakai `process.env.PORT`, script `npm start`, dan Node 22. Deploy ke platform Node.js apa pun yang mendukung GitHub/repository.

Build command: `npm install`
Start command: `npm start`

Setelah deploy, isi Environment Variables:

- `API_KEY` = buat sendiri, contoh `ignote_ubah_ini_2026`
- `APP_BASE_URL` = URL deployment kamu tanpa garis miring terakhir, contoh `https://ignote-api.example.com`

## Dipakai di bot

API mengembalikan PNG langsung. URL endpoint dapat dipakai sebagai URL image oleh fitur `asImage:true` di bot.

Jangan taruh API key asli di halaman publik atau source code repository publik.
