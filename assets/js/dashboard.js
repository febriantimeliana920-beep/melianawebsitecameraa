(async function () {
  await DataStore.ensureReady();
  const res = await DataStore.getStats();
  if (!res.ok || !res.data.success) {
    document.getElementById('table-terbaru').innerHTML =
      '<tr><td colspan="3" class="empty-state">Gagal memuat data</td></tr>';
    return;
  }
  const d = res.data.data;
  document.getElementById('stat-total').textContent = d.total_karyawan;
  document.getElementById('stat-hadir').textContent = d.hadir_hari_ini;
  document.getElementById('stat-belum').textContent = d.belum_hadir;
  document.getElementById('stat-catatan').textContent = d.total_absensi_hari_ini;

  const tbody = document.getElementById('table-terbaru');
  if (!d.terbaru?.length) {
    tbody.innerHTML = '<tr><td colspan="3" class="empty-state">Belum ada absensi</td></tr>';
    return;
  }
  tbody.innerHTML = d.terbaru
    .map(
      (row) => `
      <tr>
        <td>${esc(row.nama)}<br><small style="color:var(--muted)">${esc(row.nip)}</small></td>
        <td><span class="badge badge-${row.tipe}">${row.tipe}</span></td>
        <td>${formatWaktu(row.waktu)}</td>
      </tr>`
    )
    .join('');

  function esc(s) {
    const el = document.createElement('span');
    el.textContent = s;
    return el.innerHTML;
  }
  function formatWaktu(s) {
    try {
      return new Date(String(s).replace(' ', 'T')).toLocaleString('id-ID');
    } catch {
      return s;
    }
  }
})();

window.onBackupImported = () => location.reload();
