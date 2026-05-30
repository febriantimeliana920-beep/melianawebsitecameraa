<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

try {
    $today = date('Y-m-d');
    $conn = db();

    $totalKaryawan = (int) $conn->query(
        'SELECT COUNT(*) AS c FROM karyawan WHERE aktif = 1'
    )->fetch_assoc()['c'];

    $hadir = (int) $conn->query(
        "SELECT COUNT(DISTINCT karyawan_id) AS c FROM absensi
         WHERE DATE(waktu) = '$today' AND tipe = 'masuk'"
    )->fetch_assoc()['c'];

    $absensiHariIni = (int) $conn->query(
        "SELECT COUNT(*) AS c FROM absensi WHERE DATE(waktu) = '$today'"
    )->fetch_assoc()['c'];

    $terbaru = $conn->query(
        "SELECT a.tipe, a.waktu, a.confidence, k.nama, k.nip
         FROM absensi a
         INNER JOIN karyawan k ON k.id = a.karyawan_id
         ORDER BY a.waktu DESC LIMIT 8"
    )->fetch_all(MYSQLI_ASSOC);

    json_response([
        'success' => true,
        'data' => [
            'total_karyawan' => $totalKaryawan,
            'hadir_hari_ini' => $hadir,
            'belum_hadir' => max(0, $totalKaryawan - $hadir),
            'total_absensi_hari_ini' => $absensiHariIni,
            'terbaru' => $terbaru,
        ],
    ]);
} catch (Throwable $e) {
    json_response(['success' => false, 'message' => $e->getMessage()], 500);
}
