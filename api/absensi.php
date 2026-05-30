<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    if ($method === 'GET') {
        $tanggal = $_GET['tanggal'] ?? date('Y-m-d');
        $karyawanId = isset($_GET['karyawan_id']) ? (int) $_GET['karyawan_id'] : 0;

        $sql = 'SELECT a.id, a.tipe, a.waktu, a.confidence, a.foto_snapshot,
                       k.id AS karyawan_id, k.nip, k.nama, k.jabatan
                FROM absensi a
                INNER JOIN karyawan k ON k.id = a.karyawan_id
                WHERE DATE(a.waktu) = ?';
        $types = 's';
        $params = [$tanggal];

        if ($karyawanId > 0) {
            $sql .= ' AND a.karyawan_id = ?';
            $types .= 'i';
            $params[] = $karyawanId;
        }
        $sql .= ' ORDER BY a.waktu DESC';

        $stmt = db()->prepare($sql);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        json_response(['success' => true, 'data' => $rows, 'tanggal' => $tanggal]);
    }

    if ($method === 'POST') {
        $body = read_json_body();
        $karyawanId = (int) ($body['karyawan_id'] ?? 0);
        $tipe = $body['tipe'] ?? 'masuk';
        $confidence = isset($body['confidence']) ? (float) $body['confidence'] : null;
        $fotoBase64 = $body['foto'] ?? null;

        if ($karyawanId <= 0) {
            json_response(['success' => false, 'message' => 'Karyawan tidak valid'], 400);
        }
        if (!in_array($tipe, ['masuk', 'keluar'], true)) {
            json_response(['success' => false, 'message' => 'Tipe absensi tidak valid'], 400);
        }

        $check = db()->prepare('SELECT id, nama FROM karyawan WHERE id = ? AND aktif = 1');
        $check->bind_param('i', $karyawanId);
        $check->execute();
        $karyawan = $check->get_result()->fetch_assoc();
        if (!$karyawan) {
            json_response(['success' => false, 'message' => 'Karyawan tidak ditemukan'], 404);
        }

        // Cegah duplikat tipe yang sama dalam 2 menit terakhir
        $dup = db()->prepare(
            "SELECT id FROM absensi
             WHERE karyawan_id = ? AND tipe = ?
             AND waktu > DATE_SUB(NOW(), INTERVAL 2 MINUTE)"
        );
        $dup->bind_param('is', $karyawanId, $tipe);
        $dup->execute();
        if ($dup->get_result()->num_rows > 0) {
            json_response([
                'success' => false,
                'message' => 'Absensi ' . $tipe . ' baru saja dicatat. Tunggu beberapa saat.',
            ], 429);
        }

        $fotoPath = null;
        if (is_string($fotoBase64) && str_contains($fotoBase64, 'base64,')) {
            $fotoPath = save_snapshot($fotoBase64);
        }

        $stmt = db()->prepare(
            'INSERT INTO absensi (karyawan_id, tipe, confidence, foto_snapshot) VALUES (?, ?, ?, ?)'
        );
        $stmt->bind_param('isds', $karyawanId, $tipe, $confidence, $fotoPath);
        $stmt->execute();

        json_response([
            'success' => true,
            'message' => 'Absensi ' . $tipe . ' berhasil',
            'data' => [
                'id' => (int) $stmt->insert_id,
                'nama' => $karyawan['nama'],
                'tipe' => $tipe,
                'waktu' => date('Y-m-d H:i:s'),
            ],
        ], 201);
    }

    json_response(['success' => false, 'message' => 'Method tidak didukung'], 405);
} catch (Throwable $e) {
    json_response(['success' => false, 'message' => $e->getMessage()], 500);
}

function save_snapshot(string $dataUrl): string
{
    $dir = __DIR__ . '/../uploads/absensi';
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    [, $data] = explode('base64,', $dataUrl, 2);
    $binary = base64_decode($data, true);
    $filename = 'absensi_' . date('YmdHis') . '_' . bin2hex(random_bytes(4)) . '.jpg';
    $path = $dir . '/' . $filename;
    file_put_contents($path, $binary);
    return 'uploads/absensi/' . $filename;
}
