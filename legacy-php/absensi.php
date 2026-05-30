<?php
$pageTitle = 'Absensi';
require_once __DIR__ . '/includes/header.php';
?>

<div class="page-header">
  <h1>Absensi Wajah</h1>
  <p>Scan wajah via kamera untuk mencatat masuk atau keluar</p>
</div>

<div class="alert alert-info">
  Izinkan akses kamera saat browser meminta. Tunggu hingga tulisan &quot;Model siap&quot; sebelum memulai kamera.
</div>

<div class="tipe-toggle">
  <button type="button" class="btn btn-success active" data-tipe="masuk">Absen Masuk</button>
  <button type="button" class="btn btn-secondary" data-tipe="keluar">Absen Keluar</button>
</div>

<div class="grid-2">
  <div>
    <div class="camera-panel">
      <video id="video" autoplay playsinline muted></video>
      <canvas id="overlay"></canvas>
      <div id="camera-status" class="camera-status">Memuat...</div>
    </div>
    <div class="btn-group">
      <button type="button" id="btn-start" class="btn btn-primary">Mulai Kamera</button>
      <button type="button" id="btn-stop" class="btn btn-danger" disabled>Stop</button>
      <button type="button" id="btn-manual" class="btn btn-secondary" disabled>Absen Sekarang</button>
      <button type="button" id="btn-reload-faces" class="btn btn-secondary">Muat Ulang Data Wajah</button>
    </div>
  </div>
  <div>
    <div class="card">
      <div class="card-title">Hasil Pengenalan</div>
      <div id="match-result" class="match-result">
        <p style="color: var(--muted);">Wajah yang dikenali akan muncul di sini.</p>
      </div>
    </div>
  </div>
</div>

<div id="loader" class="loader-overlay">
  <div class="spinner"></div>
  <p>Memuat model AI...</p>
</div>

<?php require_once __DIR__ . '/includes/face_scripts.php'; ?>
<script src="<?= $baseUrl ?>/assets/js/absensi.js"></script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
