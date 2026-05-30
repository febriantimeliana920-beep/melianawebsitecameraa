<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

/** Mengembalikan semua descriptor wajah aktif untuk pencocokan di browser */
try {
    $result = db()->query(
        'SELECT id, nip, nama, face_descriptor FROM karyawan WHERE aktif = 1 ORDER BY nama'
    );
    $list = [];
    while ($row = $result->fetch_assoc()) {
        $descriptor = json_decode($row['face_descriptor'], true);
        if (!is_array($descriptor) || count($descriptor) !== 128) {
            continue;
        }
        $list[] = [
            'id' => (int) $row['id'],
            'nip' => $row['nip'],
            'nama' => $row['nama'],
            'descriptor' => array_map('floatval', $descriptor),
        ];
    }
    json_response(['success' => true, 'data' => $list]);
} catch (Throwable $e) {
    json_response(['success' => false, 'message' => $e->getMessage()], 500);
}
