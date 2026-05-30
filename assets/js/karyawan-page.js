(async function () {
  const tbody = document.getElementById('karyawan-body');

  async function load() {
    await DataStore.ensureReady();
    const res = await DataStore.listKaryawan(true);
    if (!res.ok || !res.data.success) {
      tbody.innerHTML = `<tr><td colspan="5">${esc(res.data.message || 'Gagal')}</td></tr>`;
      return;
    }
    const rows = res.data.data.filter((r) => r.aktif == 1);
    if (!rows.length) {
      tbody.innerHTML =
        '<tr><td colspan="5" class="empty-state">Belum ada karyawan. <a href="registrasi.html">Daftarkan wajah</a></td></tr>';
      return;
    }
    tbody.innerHTML = rows
      .map(
        (r) => `
      <tr>
        <td>${esc(r.nip)}</td>
        <td>${esc(r.nama)}</td>
        <td>${esc(r.jabatan || '—')}</td>
        <td>${formatDate(r.created_at)}</td>
        <td><button type="button" class="btn btn-danger btn-sm" data-id="${r.id}">Nonaktifkan</button></td>
      </tr>`
      )
      .join('');

    tbody.querySelectorAll('[data-id]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Nonaktifkan karyawan ini?')) return;
        const del = await DataStore.deactivateKaryawan(btn.dataset.id);
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
      return new Date(String(s).replace(' ', 'T')).toLocaleDateString('id-ID');
    } catch {
      return s;
    }
  }

  window.onBackupImported = load;
  load();
})();
