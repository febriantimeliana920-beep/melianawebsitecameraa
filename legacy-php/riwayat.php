<?php
$pageTitle = 'Riwayat Absensi';
require_once __DIR__ . '/includes/header.php';
$tanggal = $_GET['tanggal'] ?? date('Y-m-d');
?>

<div class="page-header">
  <h1>Riwayat Absensi</h1>
  <p>Daftar catatan absensi per tanggal</p>
</div>

<div class="card" style="margin-bottom: 1.5rem;">
  <form method="get" style="display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap;">
    <div class="form-group" style="margin-bottom: 0;">
      <label for="tanggal">Tanggal</label>
      <input type="date" id="tanggal" name="tanggal" value="<?= htmlspecialchars($tanggal) ?>">
    </div>
    <button type="submit" class="btn btn-primary">Tampilkan</button>
  </form>
</div>

<div class="card">
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Waktu</th>
          <th>NIP</th>
          <th>Nama</th>
          <th>Jabatan</th>
          <th>Tipe</th>
          <th>Akurasi</th>
        </tr>
      </thead>
      <tbody id="riwayat-body">
        <tr><td colspan="6" class="empty-state">Memuat...</td></tr>
      </tbody>
    </table>
  </div>
</div>

<script>
(async function () {
  const base = window.APP_BASE || '';
  const tanggal = <?= json_encode($tanggal) ?>;
  const tbody = document.getElementById('riwayat-body');

  try {
    const res = await fetch(`${base}/api/absensi.php?tanggal=${encodeURIComponent(tanggal)}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message);

    if (!json.data.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Tidak ada data untuk tanggal ini</td></tr>';
      return;
    }

    tbody.innerHTML = json.data.map((row) => `
      <tr>
        <td>${formatWaktu(row.waktu)}</td>
        <td>${esc(row.nip)}</td>
        <td>${esc(row.nama)}</td>
        <td>${esc(row.jabatan || '—')}</td>
        <td><span class="badge badge-${row.tipe}">${row.tipe}</span></td>
        <td>${row.confidence != null ? Math.round(row.confidence * 100) + '%' : '—'}</td>
      </tr>
    `).join('');
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">${esc(e.message)}</td></tr>`;
  }

  function esc(s) {
    const el = document.createElement('span');
    el.textContent = s ?? '';
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
