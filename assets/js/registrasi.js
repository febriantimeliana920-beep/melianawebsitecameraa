(function () {
  const video = document.getElementById('video');
  const canvas = document.getElementById('overlay');
  const statusEl = document.getElementById('camera-status');
  const form = document.getElementById('form-registrasi');
  const btnCamera = document.getElementById('btn-camera');
  const btnCapture = document.getElementById('btn-capture');
  const btnSubmit = document.getElementById('btn-submit');
  const loader = document.getElementById('loader');
  const stepsEl = document.getElementById('step-dots');
  const alertEl = document.getElementById('alert-box');

  const SAMPLES_NEEDED = 3;
  let stream = null;
  let samples = [];
  let capturing = false;

  const dots = Array.from({ length: SAMPLES_NEEDED }, (_, i) => {
    const dot = document.createElement('span');
    dot.className = 'step-dot';
    dot.title = `Sampel ${i + 1}`;
    stepsEl.appendChild(dot);
    return dot;
  });

  function updateSteps() {
    dots.forEach((dot, i) => {
      dot.classList.remove('done', 'active');
      if (i < samples.length) dot.classList.add('done');
      else if (i === samples.length) dot.classList.add('active');
    });
    btnSubmit.disabled = samples.length < SAMPLES_NEEDED;
    btnCapture.disabled = !stream || samples.length >= SAMPLES_NEEDED || capturing;
  }

  async function init() {
    showLoader('Memuat model AI...');
    try {
      await FaceEngine.loadModels((msg) => {
        loader.querySelector('p').textContent = msg;
      });
      setStatus('Model siap. Isi NIP & nama, lalu nyalakan kamera.', '');
      showAlert('Ambil 3 sampel wajah dengan pencahayaan cukup.', 'info');
    } catch (e) {
      showAlert(e.message, 'error');
      setStatus('Gagal memuat model.', 'error');
    } finally {
      hideLoader();
    }
    updateSteps();
  }

  btnCamera.addEventListener('click', async () => {
    if (stream) {
      FaceEngine.stopCamera(stream);
      stream = null;
      video.srcObject = null;
      btnCamera.textContent = 'Nyalakan Kamera';
      btnCapture.disabled = true;
      setStatus('Kamera dimatikan.', '');
      return;
    }
    btnCamera.disabled = true;
    try {
      stream = await FaceEngine.startCamera(video);
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      btnCamera.textContent = 'Matikan Kamera';
      setStatus('Hadapkan wajah lurus, klik Ambil Sampel (3×).', 'scanning');
    } catch (e) {
      showAlert('Kamera: ' + e.message, 'error');
    } finally {
      btnCamera.disabled = false;
      updateSteps();
    }
  });

  btnCapture.addEventListener('click', async () => {
    if (capturing || !stream) return;
    capturing = true;
    updateSteps();
    setStatus('Mendeteksi wajah...', 'scanning');

    try {
      const detection = await FaceEngine.detectSingleFace(video);
      if (!detection) {
        setStatus('Wajah tidak terdeteksi. Dekatkan wajah & perbaiki cahaya.', 'error');
        return;
      }
      FaceEngine.drawDetection(canvas, video, detection);
      samples.push(FaceEngine.descriptorToArray(detection.descriptor));
      setStatus(`Sampel ${samples.length}/${SAMPLES_NEEDED} OK.`, 'success');
      if (samples.length >= SAMPLES_NEEDED) {
        setStatus('Sampel lengkap — klik Simpan Pendaftaran.', 'success');
      }
    } catch (e) {
      showAlert('Deteksi gagal: ' + e.message, 'error');
    } finally {
      capturing = false;
      updateSteps();
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (samples.length < SAMPLES_NEEDED) {
      showAlert('Ambil 3 sampel wajah terlebih dahulu.', 'error');
      return;
    }

    const nip = form.nip.value.trim();
    const nama = form.nama.value.trim();
    const jabatan = form.jabatan.value.trim();
    if (!nip || !nama) {
      showAlert('NIP dan nama wajib diisi.', 'error');
      return;
    }

    btnSubmit.disabled = true;
    showLoader('Menyimpan ke database...');

    const avgDescriptor = FaceEngine.averageDescriptors(samples);
    const foto = stream ? FaceEngine.captureFrame(video) : null;

    const res = await apiFetch('/api/karyawan.php', {
      method: 'POST',
      body: JSON.stringify({
        nip,
        nama,
        jabatan,
        face_descriptor: avgDescriptor,
        foto: foto || undefined,
      }),
    });

    hideLoader();

    if (res.ok && res.data.success) {
      showAlert(res.data.message + ' Sekarang bisa absen di menu Absensi.', 'success');
      form.reset();
      samples = [];
      clearCanvas();
    } else {
      showAlert(res.data.message || 'Gagal menyimpan', 'error');
    }
    updateSteps();
  });

  function setStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = 'camera-status ' + (type || '');
  }

  function showAlert(msg, type) {
    alertEl.className = 'alert alert-' + (type === 'error' ? 'error' : type === 'success' ? 'success' : 'info');
    alertEl.textContent = msg;
    alertEl.hidden = false;
  }

  function clearCanvas() {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function showLoader(text) {
    loader.classList.remove('hidden');
    loader.querySelector('p').textContent = text;
  }

  function hideLoader() {
    loader.classList.add('hidden');
  }

  init();
})();
