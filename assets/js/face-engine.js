/**
 * Mesin pengenalan wajah — @vladmandic/face-api + TensorFlow.js
 */
const FaceEngine = (function () {
  const MODEL_CDN = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.14/model/';
  const MODEL_LOCAL = (window.APP_BASE || '') + '/assets/models/';
  const MATCH_THRESHOLD = 0.6;

  let modelsLoaded = false;
  let loadingPromise = null;
  let tfReady = false;

  function getTf() {
    if (typeof faceapi !== 'undefined' && faceapi.tf) return faceapi.tf;
    if (typeof tf !== 'undefined') return tf;
    return null;
  }

  async function initTensorFlow(onProgress) {
    if (tfReady) return;

    const tensorflow = getTf();
    if (!tensorflow) {
      throw new Error('TensorFlow.js tidak dimuat. Periksa koneksi internet lalu muat ulang halaman.');
    }

    onProgress?.('Menginisialisasi TensorFlow...');

    const env = tensorflow.env && tensorflow.env();
    if (env && typeof env.set === 'function') {
      try {
        env.set('WEBGL_PACK', false);
      } catch (_) {}
    }

    const backends = ['webgl', 'cpu'];
    let backendOk = false;
    for (const name of backends) {
      try {
        const ok = await tensorflow.setBackend(name);
        if (ok) {
          backendOk = true;
          break;
        }
      } catch (_) {}
    }

    if (!backendOk) {
      await tensorflow.setBackend('cpu');
    }

    await tensorflow.ready();
    tfReady = true;
    onProgress?.(`Backend: ${tensorflow.getBackend()}`);
  }

  async function loadModelsFromUri(baseUri, onProgress) {
    onProgress?.('Memuat detektor wajah...');
    await faceapi.nets.tinyFaceDetector.loadFromUri(baseUri);
    onProgress?.('Memuat landmark...');
    await faceapi.nets.faceLandmark68Net.loadFromUri(baseUri);
    onProgress?.('Memuat pengenalan wajah...');
    await faceapi.nets.faceRecognitionNet.loadFromUri(baseUri);
  }

  async function loadModels(onProgress) {
    if (modelsLoaded) return;
    if (loadingPromise) return loadingPromise;

    loadingPromise = (async () => {
      if (typeof faceapi === 'undefined') {
        throw new Error('face-api belum dimuat. Periksa koneksi internet.');
      }

      await initTensorFlow(onProgress);

      try {
        await loadModelsFromUri(MODEL_CDN, onProgress);
      } catch (cdnErr) {
        console.warn('CDN gagal, coba model lokal:', cdnErr);
        await loadModelsFromUri(MODEL_LOCAL, onProgress);
      }

      modelsLoaded = true;
      onProgress?.('Model siap.');
    })();

    return loadingPromise;
  }

  async function startCamera(videoEl, facingMode = 'user') {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Browser tidak mendukung kamera. Gunakan Chrome/Edge di localhost.');
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode, width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    });
    videoEl.srcObject = stream;
    videoEl.setAttribute('playsinline', '');
    videoEl.muted = true;
    await videoEl.play();
    await waitForVideoReady(videoEl);
    return stream;
  }

  function waitForVideoReady(video, timeoutMs = 8000) {
    return new Promise((resolve, reject) => {
      if (video.videoWidth > 0 && video.readyState >= 2) {
        resolve();
        return;
      }
      const t0 = Date.now();
      const tick = () => {
        if (video.videoWidth > 0 && video.readyState >= 2) {
          resolve();
          return;
        }
        if (Date.now() - t0 > timeoutMs) {
          reject(new Error('Kamera tidak siap. Coba refresh halaman.'));
          return;
        }
        requestAnimationFrame(tick);
      };
      video.onloadedmetadata = () => resolve();
      tick();
    });
  }

  function stopCamera(stream) {
    if (stream) stream.getTracks().forEach((t) => t.stop());
  }

  const detectorOptions = () =>
    new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 });

  async function detectSingleFace(videoOrCanvas) {
    await loadModels();
    return faceapi
      .detectSingleFace(videoOrCanvas, detectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();
  }

  function drawDetection(canvas, video, detection) {
    if (!detection || !video?.videoWidth) return;
    const displaySize = { width: video.videoWidth, height: video.videoHeight };
    faceapi.matchDimensions(canvas, displaySize);
    const resized = faceapi.resizeResults(detection, displaySize);
    const targets = Array.isArray(resized) ? resized : resized ? [resized] : [];
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (targets.length) {
      faceapi.draw.drawDetections(canvas, targets);
      faceapi.draw.drawFaceLandmarks(canvas, targets);
    }
  }

  function descriptorToArray(descriptor) {
    return Array.from(descriptor);
  }

  function euclideanDistance(a, b) {
    if (!a || !b || a.length !== b.length) return Infinity;
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const d = a[i] - b[i];
      sum += d * d;
    }
    return Math.sqrt(sum);
  }

  function findBestMatch(descriptor, knownList) {
    let best = null;
    let bestDistance = Infinity;

    for (const person of knownList) {
      const dist = euclideanDistance(descriptor, person.descriptor);
      if (dist < bestDistance) {
        bestDistance = dist;
        best = person;
      }
    }

    const matched = bestDistance <= MATCH_THRESHOLD;
    const confidence = matched
      ? Math.max(0, Math.min(1, 1 - bestDistance / MATCH_THRESHOLD))
      : 0;

    return { matched, distance: bestDistance, confidence, person: matched ? best : null, threshold: MATCH_THRESHOLD };
  }

  function captureFrame(video) {
    if (!video?.videoWidth) return null;
    const c = document.createElement('canvas');
    c.width = video.videoWidth;
    c.height = video.videoHeight;
    c.getContext('2d').drawImage(video, 0, 0);
    return c.toDataURL('image/jpeg', 0.85);
  }

  function averageDescriptors(descriptors) {
    if (!descriptors?.length) return null;
    const len = descriptors[0].length;
    const avg = new Array(len).fill(0);
    for (const d of descriptors) {
      for (let i = 0; i < len; i++) avg[i] += d[i];
    }
    for (let i = 0; i < len; i++) avg[i] /= descriptors.length;
    return avg;
  }

  return {
    MATCH_THRESHOLD,
    loadModels,
    initTensorFlow,
    startCamera,
    stopCamera,
    detectSingleFace,
    drawDetection,
    descriptorToArray,
    findBestMatch,
    captureFrame,
    averageDescriptors,
  };
})();

async function apiFetch(path, options = {}) {
  const base = window.APP_BASE || '';
  const url = `${base}${path}`;
  let res;
  try {
    res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
  } catch (e) {
    return { ok: false, status: 0, data: { success: false, message: 'Tidak dapat terhubung ke server: ' + e.message } };
  }

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    const preview = text.replace(/\s+/g, ' ').slice(0, 80);
    data = {
      success: false,
      message:
        'Respon server bukan JSON. Pastikan Apache & MySQL XAMPP aktif. (' + (preview || res.status) + ')',
    };
  }
  if (!res.ok && !data.message) data.message = 'Permintaan gagal (HTTP ' + res.status + ')';
  return { ok: res.ok, status: res.status, data };
}
