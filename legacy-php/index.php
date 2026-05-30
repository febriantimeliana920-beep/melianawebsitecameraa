<?php
$pageTitle = 'Dashboard';
require_once __DIR__ . '/includes/header.php';
?>

<div class="page-header">
  <h1>Dashboard</h1>
  <p>Ringkasan absensi wajah hari ini</p>
</div>

<div class="stats-grid" id="stats-grid">
  <div class="stat-card primary">
    <div class="label">Total Karyawan</div>
    <div class="value" id="stat-total">—</div>
  </div>
  <div class="stat-card success">
    <div class="label">Hadir Hari Ini</div>
    <div class="value" id="stat-hadir">—</div>
  </div>
  <div class="stat-card warning">
    <div class="label">Belum Absen Masuk</div>
    <div class="value" id="stat-belum">—</div>
  </div>
  <div class="stat-card">
    <div class="label">Total Catatan Hari Ini</div>
    <div class="value" id="stat-catatan">—</div>
  </div>
</div>

<div class="grid-2">
  <div class="card">
    <div class="card-title">Absensi Terbaru</div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Nama</th>
            <th>Tipe</th>
            <th>Waktu</th>
          </tr>
        </thead>
        <tbody id="table-terbaru">
          <tr><td colspan="3" class="empty-state">Memuat...</td></tr>
        </tbody>
      </table>
    </div>
  </div>
  <div class="card">
    <div class="card-title">Mulai Absensi</div>
    <p style="color: var(--muted); margin-bottom: 1rem;">
      Buka halaman absensi, izinkan akses kamera, dan posisikan wajah di depan layar.
      Sistem akan mencocokkan wajah dengan data terdaftar secara otomatis.
    </p>
    <a href="<?= $baseUrl ?>/absensi.php" class="btn btn-primary">Buka Absensi →</a>
    <a href="<?= $baseUrl ?>/registrasi.php" class="btn btn-secondary" style="margin-left: 0.5rem;">Daftar Wajah Baru</a>
  </div>
</div>

<script src="<?= $baseUrl ?>/assets/js/face-engine.js"></script>
<script>
(async function () {
  const base = window.APP_BASE || '';
  try {
    const res = await fetch(base + '/api/stats.php');
    const json = await res.json();
    if (!json.success) throw new Error(json.message);

    const d = json.data;
    document.getElementById('stat-total').textContent = d.total_karyawan;
    document.getElementById('stat-hadir').textContent = d.hadir_hari_ini;
    document.getElementById('stat-belum').textContent = d.belum_hadir;
    document.getElementById('stat-catatan').textContent = d.total_absensi_hari_ini;

    const tbody = document.getElementById('table-terbaru');
    if (!d.terbaru || d.terbaru.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="empty-state">Belum ada absensi</td></tr>';
      return;
    }
    tbody.innerHTML = d.terbaru.map((row) => `
      <tr>
        <td>${esc(row.nama)}<br><small style="color:var(--muted)">${esc(row.nip)}</small></td>
        <td><span class="badge badge-${row.tipe}">${row.tipe}</span></td>
        <td>${formatWaktu(row.waktu)}</td>
      </tr>
    `).join('');
  } catch (e) {
    document.getElementById('table-terbaru').innerHTML =
      `<tr><td colspan="3" class="empty-state">Gagal memuat: ${esc(e.message)}. Pastikan database sudah diimport.</td></tr>`;
  }

  function esc(s) {
    const el = document.createElement('span');
    el.textContent = s;
    return el.innerHTML;
  }
  function formatWaktu(s) {
    try {
      return new Date(s.replace(' ', 'T')).toLocaleString('id-ID');
    } catch { return s; }
  }
})();
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
