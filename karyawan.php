<?php
$pageTitle = 'Data Karyawan';
require_once __DIR__ . '/includes/header.php';
?>

<div class="page-header">
  <h1>Data Karyawan</h1>
  <p>Karyawan terdaftar dengan wajah aktif</p>
</div>

<div class="card">
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>NIP</th>
          <th>Nama</th>
          <th>Jabatan</th>
          <th>Terdaftar</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody id="karyawan-body">
        <tr><td colspan="5" class="empty-state">Memuat...</td></tr>
      </tbody>
    </table>
  </div>
</div>

<script src="<?= $baseUrl ?>/assets/js/face-engine.js"></script>
<script>
(async function () {
  const tbody = document.getElementById('karyawan-body');

  async function load() {
    const res = await apiFetch('/api/karyawan.php?all=1');
    if (!res.ok || !res.data.success) {
      tbody.innerHTML = `<tr><td colspan="5">${res.data.message}</td></tr>`;
      return;
    }
    const rows = res.data.data.filter((r) => r.aktif == 1);
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Belum ada karyawan. <a href="registrasi.php">Daftarkan wajah</a></td></tr>';
      return;
    }
    tbody.innerHTML = rows.map((r) => `
      <tr>
        <td>${esc(r.nip)}</td>
        <td>${esc(r.nama)}</td>
        <td>${esc(r.jabatan || '—')}</td>
        <td>${formatDate(r.created_at)}</td>
        <td><button class="btn btn-danger btn-sm" data-id="${r.id}">Nonaktifkan</button></td>
      </tr>
    `).join('');

    tbody.querySelectorAll('[data-id]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Nonaktifkan karyawan ini? Wajah tidak bisa dipakai absensi.')) return;
        const id = btn.dataset.id;
        const del = await apiFetch(`/api/karyawan.php?id=${id}`, { method: 'DELETE' });
        alert(del.data.message || (del.ok ? 'Berhasil' : 'Gagal'));
        load();
      });
    });
  }

  function esc(s) {
    const el = document.createElement('span');
    el.textContent = s;
    return el.innerHTML;
  }
  function formatDate(s) {
    try {
      return new Date(s.replace(' ', 'T')).toLocaleDateString('id-ID');
    } catch { return s; }
  }

  load();
})();
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
