(function () {
  const video = document.getElementById('video');
  const canvas = document.getElementById('overlay');
  const statusEl = document.getElementById('camera-status');
  const resultEl = document.getElementById('match-result');
  const btnStart = document.getElementById('btn-start');
  const btnStop = document.getElementById('btn-stop');
  const btnManual = document.getElementById('btn-manual');
  const btnReload = document.getElementById('btn-reload-faces');
  const loader = document.getElementById('loader');

  let stream = null;
  let knownFaces = [];
  let scanning = false;
  let scanBusy = false;
  let scanInterval = null;
  let lastMatchId = null;
  let lastMatchTime = 0;
  let lastGoodMatch = null;
  let tipeAbsensi = 'masuk';
  let recording = false;

  document.querySelectorAll('[data-tipe]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-tipe]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      tipeAbsensi = btn.dataset.tipe;
    });
  });

  async function loadDescriptors() {
    const res = await apiFetch('/api/descriptors.php');
    if (!res.ok || !res.data.success) {
      throw new Error(res.data.message || 'Gagal memuat data wajah');
    }
    knownFaces = res.data.data || [];
    return knownFaces;
  }

  async function init() {
    showLoader('Memuat model AI...');
    try {
      await FaceEngine.loadModels((msg) => {
        loader.querySelector('p').textContent = msg;
      });
      await loadDescriptors();
      if (knownFaces.length === 0) {
        setStatus('Belum ada wajah terdaftar. Buka menu Daftar Wajah dulu.', 'error');
      } else {
        setStatus(`${knownFaces.length} wajah siap. Klik Mulai Kamera.`, '');
      }
    } catch (e) {
      setStatus(e.message, 'error');
    } finally {
      hideLoader();
      updateManualButton();
    }
  }

  btnReload?.addEventListener('click', async () => {
    try {
      await loadDescriptors();
      setStatus(`${knownFaces.length} wajah dimuat ulang.`, 'success');
    } catch (e) {
      setStatus(e.message, 'error');
    }
    updateManualButton();
  });

  btnStart.addEventListener('click', async () => {
    if (knownFaces.length === 0) {
      alert('Daftarkan minimal satu karyawan di menu Daftar Wajah.');
      return;
    }
    try {
      btnStart.disabled = true;
      stream = await FaceEngine.startCamera(video);
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      scanning = true;
      btnStop.disabled = false;
      setStatus('Arahkan wajah ke kamera...', 'scanning');
      scanInterval = setInterval(() => {
        scanFrame().catch((err) => console.error(err));
      }, 500);
    } catch (e) {
      setStatus('Kamera: ' + e.message, 'error');
      btnStart.disabled = false;
    }
  });

  btnStop.addEventListener('click', stopScan);

  btnManual?.addEventListener('click', async () => {
    if (!lastGoodMatch?.matched) {
      setStatus('Wajah belum dikenali. Hadapkan wajah ke kamera.', 'error');
      return;
    }
    await recordAttendance(lastGoodMatch);
  });

  async function scanFrame() {
    if (!scanning || scanBusy || recording || video.readyState < 2 || !video.videoWidth) return;

    scanBusy = true;
    try {
      const detection = await FaceEngine.detectSingleFace(video);
      if (!detection) {
        lastGoodMatch = null;
        setStatus('Wajah tidak terdeteksi — posisikan wajah di tengah', 'scanning');
        clearCanvas();
        updateManualButton();
        return;
      }

      FaceEngine.drawDetection(canvas, video, detection);
      const descriptor = FaceEngine.descriptorToArray(detection.descriptor);
      const match = FaceEngine.findBestMatch(descriptor, knownFaces);
      lastGoodMatch = match;

      if (!match.matched) {
        setStatus(`Wajah tidak dikenali (jarak ${match.distance.toFixed(2)}, max ${match.threshold})`, 'error');
        resultEl.innerHTML = '<p style="color:var(--muted)">Tidak cocok dengan data terdaftar.</p>';
        updateManualButton();
        return;
      }

      showMatchResult(match);
      updateManualButton();

      const now = Date.now();
      if (lastMatchId === match.person.id && now - lastMatchTime < 8000) {
        setStatus(`${match.person.nama} — tunggu sebelum absen lagi`, 'scanning');
        return;
      }

      setStatus(`Mencatat absensi ${match.person.nama}...`, 'scanning');
      await recordAttendance(match);
      lastMatchId = match.person.id;
      lastMatchTime = now;
    } finally {
      scanBusy = false;
    }
  }

  async function recordAttendance(match) {
    if (!match?.matched || recording) return;
    recording = true;
    btnManual && (btnManual.disabled = true);

    const foto = FaceEngine.captureFrame(video);
    const res = await apiFetch('/api/absensi.php', {
      method: 'POST',
      body: JSON.stringify({
        karyawan_id: match.person.id,
        tipe: tipeAbsensi,
        confidence: match.confidence,
        foto: foto || undefined,
      }),
    });

    recording = false;
    updateManualButton();

    if (res.ok && res.data.success) {
      setStatus(`✓ ${res.data.data.nama} — ${tipeAbsensi.toUpperCase()} ${formatTime(res.data.data.waktu)}`, 'success');
      playBeep(true);
    } else {
      setStatus(res.data.message || 'Gagal mencatat absensi', 'error');
      playBeep(false);
    }
  }

  function updateManualButton() {
    if (!btnManual) return;
    btnManual.disabled = !lastGoodMatch?.matched || recording;
  }

  function showMatchResult(match) {
    const pct = Math.round(match.confidence * 100);
    resultEl.innerHTML = `
      <h3>${escapeHtml(match.person.nama)}</h3>
      <p>NIP: ${escapeHtml(match.person.nip)} · Kecocokan: ${pct}%</p>
      <div class="threshold-bar"><span style="width:${pct}%"></span></div>
    `;
  }

  function stopScan() {
    scanning = false;
    clearInterval(scanInterval);
    FaceEngine.stopCamera(stream);
    stream = null;
    video.srcObject = null;
    clearCanvas();
    btnStart.disabled = false;
    btnStop.disabled = true;
    lastGoodMatch = null;
    updateManualButton();
    setStatus('Kamera dihentikan.', '');
  }

  function clearCanvas() {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function setStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = 'camera-status ' + (type || '');
  }

  function showLoader(text) {
    loader.classList.remove('hidden');
    loader.querySelector('p').textContent = text;
  }

  function hideLoader() {
    loader.classList.add('hidden');
  }

  function formatTime(str) {
    try {
      return new Date(str.replace(' ', 'T')).toLocaleString('id-ID');
    } catch {
      return str;
    }
  }

  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function playBeep(success) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = success ? 880 : 220;
      gain.gain.value = 0.1;
      osc.start();
      osc.stop(ctx.currentTime + (success ? 0.15 : 0.3));
    } catch (_) {}
  }

  window.addEventListener('beforeunload', stopScan);
  init();
})();
