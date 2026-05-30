/**
 * Penyimpanan JSON di localStorage (kompatibel GitHub Pages, tanpa PHP)
 */
const DataStore = (function () {
  const KEY_KARYAWAN = 'meliana_karyawan';
  const KEY_ABSENSI = 'meliana_absensi';
  const INIT_FLAG = 'meliana_store_initialized';

  let readyPromise = null;

  function nowSql() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  function todayYmd() {
    return new Date().toISOString().slice(0, 10);
  }

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function saveKaryawan(list) {
    localStorage.setItem(KEY_KARYAWAN, JSON.stringify(list));
  }

  function saveAbsensi(list) {
    localStorage.setItem(KEY_ABSENSI, JSON.stringify(list));
  }

  function getKaryawanList() {
    return loadJson(KEY_KARYAWAN, []);
  }

  function getAbsensiList() {
    return loadJson(KEY_ABSENSI, []);
  }

  function nextId(list) {
    if (!list.length) return 1;
    return Math.max(...list.map((r) => Number(r.id) || 0)) + 1;
  }

  async function fetchSeed(path) {
    const url = (typeof assetUrl === 'function' ? assetUrl(path) : path);
    const res = await fetch(url);
    if (!res.ok) throw new Error('Seed tidak ditemukan: ' + path);
    return res.json();
  }

  async function ensureReady() {
    if (readyPromise) return readyPromise;
    readyPromise = (async () => {
      if (localStorage.getItem(INIT_FLAG) === '1') return;

      try {
        const [kSeed, aSeed] = await Promise.all([
          fetchSeed('data/karyawan.json'),
          fetchSeed('data/absensi.json'),
        ]);
        if (!localStorage.getItem(KEY_KARYAWAN)) {
          saveKaryawan(Array.isArray(kSeed.karyawan) ? kSeed.karyawan : []);
        }
        if (!localStorage.getItem(KEY_ABSENSI)) {
          saveAbsensi(Array.isArray(aSeed.absensi) ? aSeed.absensi : []);
        }
      } catch (e) {
        console.warn('Seed JSON:', e);
        if (!localStorage.getItem(KEY_KARYAWAN)) saveKaryawan([]);
        if (!localStorage.getItem(KEY_ABSENSI)) saveAbsensi([]);
      }
      localStorage.setItem(INIT_FLAG, '1');
    })();
    return readyPromise;
  }

  function ok(data, extra = {}) {
    return { ok: true, status: 200, data: { success: true, ...extra, data } };
  }

  function fail(message, status = 400) {
    return { ok: false, status, data: { success: false, message } };
  }

  async function getDescriptors() {
    await ensureReady();
    const list = getKaryawanList()
      .filter((k) => k.aktif !== 0 && k.aktif !== false)
      .map((k) => ({
        id: k.id,
        nip: k.nip,
        nama: k.nama,
        descriptor: Array.isArray(k.face_descriptor) ? k.face_descriptor : [],
      }))
      .filter((k) => k.descriptor.length === 128);
    return ok(list);
  }

  async function listKaryawan(all = false) {
    await ensureReady();
    let list = getKaryawanList();
    if (!all) list = list.filter((k) => k.aktif !== 0 && k.aktif !== false);
    return ok(
      list.map((k) => ({
        id: k.id,
        nip: k.nip,
        nama: k.nama,
        jabatan: k.jabatan || '',
        foto_path: k.foto || null,
        aktif: k.aktif !== 0 && k.aktif !== false ? 1 : 0,
        created_at: k.created_at,
      }))
    );
  }

  async function addKaryawan(payload) {
    await ensureReady();
    const nip = String(payload.nip || '').trim();
    const nama = String(payload.nama || '').trim();
    const jabatan = String(payload.jabatan || '').trim();
    const descriptor = payload.face_descriptor;

    if (!nip || !nama) return fail('NIP dan nama wajib diisi');
    if (!Array.isArray(descriptor) || descriptor.length !== 128) {
      return fail('Descriptor wajah tidak valid (harus 128 dimensi)');
    }

    const list = getKaryawanList();
    if (list.some((k) => k.nip === nip && k.aktif !== 0)) {
      return fail('NIP sudah terdaftar', 409);
    }

    const row = {
      id: nextId(list),
      nip,
      nama,
      jabatan,
      face_descriptor: descriptor.map(Number),
      foto: payload.foto && String(payload.foto).indexOf('base64,') >= 0 ? payload.foto : null,
      aktif: 1,
      created_at: nowSql(),
    };
    list.push(row);
    saveKaryawan(list);
    return { ok: true, status: 201, data: { success: true, message: 'Karyawan berhasil didaftarkan', id: row.id } };
  }

  async function deactivateKaryawan(id) {
    await ensureReady();
    const list = getKaryawanList();
    const row = list.find((k) => Number(k.id) === Number(id));
    if (!row) return fail('Karyawan tidak ditemukan', 404);
    row.aktif = 0;
    saveKaryawan(list);
    return { ok: true, status: 200, data: { success: true, message: 'Karyawan dinonaktifkan' } };
  }

  async function recordAbsensi(payload) {
    await ensureReady();
    const karyawanId = Number(payload.karyawan_id);
    const tipe = payload.tipe === 'keluar' ? 'keluar' : 'masuk';
    const confidence = payload.confidence != null ? Number(payload.confidence) : null;

    if (!karyawanId) return fail('Karyawan tidak valid');

    const karyawan = getKaryawanList().find(
      (k) => Number(k.id) === karyawanId && k.aktif !== 0 && k.aktif !== false
    );
    if (!karyawan) return fail('Karyawan tidak ditemukan', 404);

    const absensi = getAbsensiList();
    const twoMinAgo = Date.now() - 2 * 60 * 1000;
    const dup = absensi.some((a) => {
      if (Number(a.karyawan_id) !== karyawanId || a.tipe !== tipe) return false;
      const t = new Date(String(a.waktu).replace(' ', 'T')).getTime();
      return t > twoMinAgo;
    });
    if (dup) {
      return fail('Absensi ' + tipe + ' baru saja dicatat. Tunggu beberapa saat.', 429);
    }

    const waktu = nowSql();
    const row = {
      id: nextId(absensi),
      karyawan_id: karyawanId,
      tipe,
      waktu,
      confidence,
      foto_snapshot:
        payload.foto && String(payload.foto).indexOf('base64,') >= 0 ? payload.foto : null,
    };
    absensi.unshift(row);
    saveAbsensi(absensi);

    return {
      ok: true,
      status: 201,
      data: {
        success: true,
        message: 'Absensi ' + tipe + ' berhasil',
        data: { id: row.id, nama: karyawan.nama, tipe, waktu },
      },
    };
  }

  async function getAbsensiByDate(tanggal) {
    await ensureReady();
    const tgl = tanggal || todayYmd();
    const kMap = Object.fromEntries(getKaryawanList().map((k) => [k.id, k]));
    const rows = getAbsensiList()
      .filter((a) => String(a.waktu).slice(0, 10) === tgl)
      .map((a) => {
        const k = kMap[a.karyawan_id] || {};
        return {
          id: a.id,
          tipe: a.tipe,
          waktu: a.waktu,
          confidence: a.confidence,
          karyawan_id: a.karyawan_id,
          nip: k.nip || '—',
          nama: k.nama || '—',
          jabatan: k.jabatan || '',
        };
      })
      .sort((a, b) => (a.waktu < b.waktu ? 1 : -1));
    return { ok: true, status: 200, data: { success: true, data: rows, tanggal: tgl } };
  }

  async function getStats() {
    await ensureReady();
    const today = todayYmd();
    const karyawan = getKaryawanList().filter((k) => k.aktif !== 0 && k.aktif !== false);
    const absensi = getAbsensiList();
    const todayAbs = absensi.filter((a) => String(a.waktu).slice(0, 10) === today);
    const hadirIds = new Set(
      todayAbs.filter((a) => a.tipe === 'masuk').map((a) => a.karyawan_id)
    );
    const kMap = Object.fromEntries(getKaryawanList().map((k) => [k.id, k]));
    const terbaru = [...absensi]
      .sort((a, b) => (a.waktu < b.waktu ? 1 : -1))
      .slice(0, 8)
      .map((a) => {
        const k = kMap[a.karyawan_id] || {};
        return {
          tipe: a.tipe,
          waktu: a.waktu,
          confidence: a.confidence,
          nama: k.nama || '—',
          nip: k.nip || '—',
        };
      });

    return {
      ok: true,
      status: 200,
      data: {
        success: true,
        data: {
          total_karyawan: karyawan.length,
          hadir_hari_ini: hadirIds.size,
          belum_hadir: Math.max(0, karyawan.length - hadirIds.size),
          total_absensi_hari_ini: todayAbs.length,
          terbaru,
        },
      },
    };
  }

  function exportBackup() {
    const payload = {
      exported_at: new Date().toISOString(),
      karyawan: getKaryawanList(),
      absensi: getAbsensiList(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'meliana-backup-' + todayYmd() + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
    return { success: true, message: 'Backup diunduh' };
  }

  async function importBackup(file) {
    const text = await file.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      return { success: false, message: 'File JSON tidak valid' };
    }
    if (!Array.isArray(json.karyawan) || !Array.isArray(json.absensi)) {
      return { success: false, message: 'Format backup harus berisi karyawan & absensi' };
    }
    saveKaryawan(json.karyawan);
    saveAbsensi(json.absensi);
    localStorage.setItem(INIT_FLAG, '1');
    return {
      success: true,
      message: `Impor berhasil: ${json.karyawan.length} karyawan, ${json.absensi.length} absensi`,
    };
  }

  function resetAll() {
    localStorage.removeItem(KEY_KARYAWAN);
    localStorage.removeItem(KEY_ABSENSI);
    localStorage.removeItem(INIT_FLAG);
    readyPromise = null;
  }

  return {
    ensureReady,
    getDescriptors,
    listKaryawan,
    addKaryawan,
    deactivateKaryawan,
    recordAbsensi,
    getAbsensiByDate,
    getStats,
    exportBackup,
    importBackup,
    resetAll,
  };
})();
