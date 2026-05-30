# Meliana — Absensi Wajah (Static / GitHub Pages)

Website absensi karyawan dengan **pengenalan wajah via kamera**. Versi ini berjalan **tanpa PHP/MySQL** — data disimpan sebagai **JSON di localStorage** browser.

## Fitur

- Daftar wajah (3 sampel + descriptor 128D)
- Absensi masuk/keluar otomatis + tombol manual
- Dashboard & riwayat
- **Ekspor / Impor JSON** (backup) di Dashboard & Karyawan
- Face-api.js + TensorFlow (WebGL)

## Menjalankan lokal

1. Buka folder project di browser:
   - **GitHub Pages lokal:** `npx serve .` lalu buka URL yang ditampilkan
   - **XAMPP:** `http://localhost/melianawebsitekamera/index.html`
2. Izinkan kamera (Chrome/Edge, HTTPS atau localhost)
3. Koneksi internet untuk model AI (unduhan pertama)

> Jangan buka file lewat `file://` — fetch seed JSON & kamera bisa gagal.

## Deploy ke GitHub Pages

1. Buat repo GitHub, push seluruh isi folder (kecuali `legacy-php/` jika tidak perlu).
2. **Settings → Pages → Source:** branch `main`, folder `/ (root)`.
3. Buka: `https://<username>.github.io/<nama-repo>/index.html`

File `.nojekyll` sudah ada agar Jekyll tidak memblokir path `assets/`.

### Subpath

Semua link memakai path relatif (`assets/`, `index.html`). `assets/js/app.js` menghitung `APP_BASE` otomatis untuk subfolder repo.

## Penyimpanan data

| Lokasi | Isi |
|--------|-----|
| `localStorage` | Data aktif (karyawan + absensi) |
| `data/karyawan.json` | Seed kosong saat pertama kunjung |
| `data/absensi.json` | Seed kosong saat pertama kunjung |
| File backup | Unduhan manual via **Ekspor JSON** |

Data **per browser/perangkat**. Untuk pindah perangkat, gunakan Ekspor → Impor.

## Versi PHP (lama)

Backend PHP + MySQL ada di folder **`legacy-php/`** (XAMPP). Gunakan jika butuh server database bersama.

## Struktur

```
index.html, registrasi.html, absensi.html, riwayat.html, karyawan.html
assets/js/   app.js, data-store.js, face-engine.js, ...
assets/css/
data/        seed JSON
legacy-php/  versi PHP (opsional)
```
