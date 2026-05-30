# Absensi Wajah — Meliana

Website absensi karyawan dengan pengenalan wajah via kamera web (browser). Dibangun untuk **XAMPP** (PHP + MySQL).

## Fitur

- **Absensi real-time** — kamera mendeteksi wajah dan mencocokkan dengan data terdaftar
- **Daftar wajah** — registrasi 3 sampel wajah per karyawan
- **Masuk / Keluar** — pilihan tipe absensi
- **Dashboard & riwayat** — statistik harian dan log absensi
- **Tanpa plugin** — AI berjalan di browser (face-api.js / TensorFlow.js)

## Persyaratan

- XAMPP dengan Apache + MySQL aktif
- PHP 8.0+
- Browser modern (Chrome / Edge) dengan akses kamera
- Koneksi internet (untuk memuat model AI pertama kali)

## Instalasi

1. Pastikan project ada di `htdocs/melianawebsitekamera`
2. Buka **phpMyAdmin** → Import file `database/schema.sql`
3. Sesuaikan kredensial DB di `config/database.php` jika perlu (default: user `root`, password kosong)
4. Akses: **http://localhost/melianawebsitekamera/**

## Alur penggunaan

1. **Daftar Wajah** — isi NIP & nama, nyalakan kamera, ambil 3 sampel, simpan
2. **Absensi** — pilih Masuk/Keluar, mulai kamera, hadapkan wajah hingga tercatat otomatis
3. **Riwayat** — lihat log per tanggal

## Catatan teknis

- Model AI diunduh dari CDN saat halaman absensi/registrasi pertama dibuka (beberapa detik)
- Ambang kecocokan wajah: jarak euclidean ≤ 0.55 (atur di `assets/js/face-engine.js`)
- Absensi duplikat diblokir jika tipe sama dalam 2 menit terakhir
- Kamera hanya berjalan di **localhost** atau **HTTPS**

## Struktur folder

```
api/           Endpoint JSON (karyawan, absensi, descriptors, stats)
assets/        CSS & JavaScript
config/        Koneksi database
database/      SQL schema
includes/      Layout header/footer
uploads/       Foto snapshot (dibuat otomatis)
```
