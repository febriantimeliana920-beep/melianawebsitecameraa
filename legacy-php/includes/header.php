<?php
$currentPage = basename($_SERVER['PHP_SELF'], '.php');
$baseUrl = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\');
if ($baseUrl === '' || $baseUrl === '.') {
    $baseUrl = '';
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= htmlspecialchars($pageTitle ?? 'Absensi Wajah') ?> — Meliana</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="<?= $baseUrl ?>/assets/css/style.css">
  <script>window.APP_BASE = <?= json_encode($baseUrl) ?>;</script>
</head>
<body>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand">
        <span class="brand-icon">📷</span>
        <div>
          <strong>Meliana</strong>
          <small>Absensi Wajah</small>
        </div>
      </div>
      <nav class="nav">
        <a href="<?= $baseUrl ?>/index.php" class="nav-link <?= $currentPage === 'index' ? 'active' : '' ?>">
          <span>🏠</span> Dashboard
        </a>
        <a href="<?= $baseUrl ?>/absensi.php" class="nav-link <?= $currentPage === 'absensi' ? 'active' : '' ?>">
          <span>✅</span> Absensi
        </a>
        <a href="<?= $baseUrl ?>/registrasi.php" class="nav-link <?= $currentPage === 'registrasi' ? 'active' : '' ?>">
          <span>👤</span> Daftar Wajah
        </a>
        <a href="<?= $baseUrl ?>/riwayat.php" class="nav-link <?= $currentPage === 'riwayat' ? 'active' : '' ?>">
          <span>📋</span> Riwayat
        </a>
        <a href="<?= $baseUrl ?>/karyawan.php" class="nav-link <?= $currentPage === 'karyawan' ? 'active' : '' ?>">
          <span>👥</span> Karyawan
        </a>
      </nav>
      <p class="sidebar-note">Pastikan kamera diizinkan di browser (HTTPS atau localhost).</p>
    </aside>
    <main class="main-content">
