(async function () {
  const input = document.getElementById('tanggal');
  const tbody = document.getElementById('riwayat-body');
  const form = document.getElementById('form-riwayat');

  if (!input.value) input.value = new Date().toISOString().slice(0, 10);

  async function load() {
    await DataStore.ensureReady();
    const tanggal = input.value;
    const res = await DataStore.getAbsensiByDate(tanggal);
    if (!res.ok || !res.data.success) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-state">${esc(res.data.message)}</td></tr>`;
      return;
    }
    const rows = res.data.data;
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Tidak ada data untuk tanggal ini</td></tr>';
      return;
    }
    tbody.innerHTML = rows
      .map(
        (row) => `
      <tr>
        <td>${formatWaktu(row.waktu)}</td>
        <td>${esc(row.nip)}</td>
        <td>${esc(row.nama)}</td>
        <td>${esc(row.jabatan || '—')}</td>
        <td><span class="badge badge-${row.tipe}">${row.tipe}</span></td>
        <td>${row.confidence != null ? Math.round(row.confidence * 100) + '%' : '—'}</td>
      </tr>`
      )
      .join('');
  }

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    load();
  });

  function esc(s) {
    const el = document.createElement('span');
    el.textContent = s ?? '';
    return el.innerHTML;
  }
  function formatWaktu(s) {
    try {
      return new Date(String(s).replace(' ', 'T')).toLocaleString('id-ID');
    } catch {
      return s;
    }
  }

  load();
})();
