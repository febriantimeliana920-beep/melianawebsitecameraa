<?php
$pageTitle = 'Daftar Wajah';
require_once __DIR__ . '/includes/header.php';
?>

<div class="page-header">
  <h1>Daftar Wajah Karyawan</h1>
  <p>Registrasi wajah baru untuk sistem absensi</p>
</div>

<div id="alert-box" class="alert alert-info">Memuat sistem pengenalan wajah...</div>

<div class="grid-2">
  <div>
    <form id="form-registrasi">
      <div class="form-group">
        <label for="nip">NIP / ID Karyawan</label>
        <input type="text" id="nip" name="nip" required placeholder="Contoh: EMP001">
      </div>
      <div class="form-group">
        <label for="nama">Nama Lengkap</label>
        <input type="text" id="nama" name="nama" required placeholder="Nama karyawan">
      </div>
      <div class="form-group">
        <label for="jabatan">Jabatan (opsional)</label>
        <input type="text" id="jabatan" name="jabatan" placeholder="Staff / Admin">
      </div>
      <p style="font-size: 0.85rem; color: var(--muted); margin-bottom: 0.5rem;">
        Ambil 3 sampel wajah dari sudut yang sama (hadap depan):
      </p>
      <div class="progress-steps" id="step-dots"></div>
      <button type="submit" id="btn-submit" class="btn btn-primary" disabled>Simpan Pendaftaran</button>
    </form>
  </div>
  <div>
    <div class="camera-panel">
      <video id="video" autoplay playsinline muted></video>
      <canvas id="overlay"></canvas>
      <div id="camera-status" class="camera-status">Tunggu model siap...</div>
    </div>
    <div class="btn-group">
      <button type="button" id="btn-camera" class="btn btn-secondary">Nyalakan Kamera</button>
      <button type="button" id="btn-capture" class="btn btn-primary" disabled>Ambil Sampel Wajah</button>
    </div>
  </div>
</div>

<div id="loader" class="loader-overlay hidden">
  <div class="spinner"></div>
  <p>Memuat...</p>
</div>

<?php require_once __DIR__ . '/includes/face_scripts.php'; ?>
<script src="<?= $baseUrl ?>/assets/js/registrasi.js"></script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
