/** Tombol ekspor/impor JSON — pasang di halaman dengan #btn-export & #btn-import */
(function () {
  const btnExport = document.getElementById('btn-export');
  const btnImport = document.getElementById('btn-import');
  const inputImport = document.getElementById('input-import');
  const backupMsg = document.getElementById('backup-msg');

  function msg(text, type) {
    if (!backupMsg) return;
    backupMsg.className = 'alert alert-' + (type || 'info');
    backupMsg.textContent = text;
    backupMsg.hidden = false;
  }

  btnExport?.addEventListener('click', async () => {
    await DataStore.ensureReady();
    const r = DataStore.exportBackup();
    msg(r.message, 'success');
  });

  btnImport?.addEventListener('click', () => inputImport?.click());

  inputImport?.addEventListener('change', async () => {
    const file = inputImport.files?.[0];
    if (!file) return;
    if (!confirm('Impor akan mengganti semua data di browser ini. Lanjutkan?')) {
      inputImport.value = '';
      return;
    }
    await DataStore.ensureReady();
    const r = await DataStore.importBackup(file);
    msg(r.message, r.success ? 'success' : 'error');
    inputImport.value = '';
    if (r.success && typeof window.onBackupImported === 'function') {
      window.onBackupImported();
    }
  });
})();
