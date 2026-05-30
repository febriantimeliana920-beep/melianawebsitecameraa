/** Muat TensorFlow + face-api (urutan penting) */
(function () {
  const base = window.APP_BASE ? window.APP_BASE + '/' : '';
  const scripts = [
    'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js',
    'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl@4.22.0/dist/tf-backend-webgl.min.js',
    'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.14/dist/face-api.js',
    base + 'assets/js/face-engine.js',
  ];
  function loadNext(i) {
    if (i >= scripts.length) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = scripts[i];
      s.onload = () => resolve(loadNext(i + 1));
      s.onerror = () => reject(new Error('Gagal memuat: ' + scripts[i]));
      document.head.appendChild(s);
    });
  }
  window.faceScriptsReady = loadNext(0);
})();
