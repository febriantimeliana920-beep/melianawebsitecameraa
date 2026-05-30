<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    if ($method === 'GET') {
        $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
        if ($id > 0) {
            $stmt = db()->prepare('SELECT id, nip, nama, jabatan, foto_path, aktif, created_at FROM karyawan WHERE id = ?');
            $stmt->bind_param('i', $id);
            $stmt->execute();
            $row = $stmt->get_result()->fetch_assoc();
            if (!$row) {
                json_response(['success' => false, 'message' => 'Karyawan tidak ditemukan'], 404);
            }
            json_response(['success' => true, 'data' => $row]);
        }

        $aktifOnly = !isset($_GET['all']) || $_GET['all'] !== '1';
        $sql = 'SELECT id, nip, nama, jabatan, foto_path, aktif, created_at FROM karyawan';
        if ($aktifOnly) {
            $sql .= ' WHERE aktif = 1';
        }
        $sql .= ' ORDER BY nama ASC';
        $result = db()->query($sql);
        $rows = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
        json_response(['success' => true, 'data' => $rows]);
    }

    if ($method === 'POST') {
        $body = read_json_body();
        $nip = trim((string) ($body['nip'] ?? ''));
        $nama = trim((string) ($body['nama'] ?? ''));
        $jabatan = trim((string) ($body['jabatan'] ?? ''));
        $descriptor = $body['face_descriptor'] ?? null;
        $fotoBase64 = $body['foto'] ?? null;

        if ($nip === '' || $nama === '') {
            json_response(['success' => false, 'message' => 'NIP dan nama wajib diisi'], 400);
        }
        if (!is_array($descriptor) || count($descriptor) !== 128) {
            json_response(['success' => false, 'message' => 'Descriptor wajah tidak valid (harus 128 dimensi)'], 400);
        }

        $check = db()->prepare('SELECT id FROM karyawan WHERE nip = ?');
        $check->bind_param('s', $nip);
        $check->execute();
        if ($check->get_result()->num_rows > 0) {
            json_response(['success' => false, 'message' => 'NIP sudah terdaftar'], 409);
        }

        $fotoPath = null;
        if (is_string($fotoBase64) && str_contains($fotoBase64, 'base64,')) {
            $fotoPath = save_base64_image($fotoBase64, 'karyawan');
        }

        $descriptorJson = json_encode(array_map('floatval', $descriptor));
        $stmt = db()->prepare(
            'INSERT INTO karyawan (nip, nama, jabatan, face_descriptor, foto_path) VALUES (?, ?, ?, ?, ?)'
        );
        $jabatanVal = $jabatan !== '' ? $jabatan : '';
        $fotoPathVal = $fotoPath ?? '';
        $stmt->bind_param('sssss', $nip, $nama, $jabatanVal, $descriptorJson, $fotoPathVal);
        $stmt->execute();

        json_response([
            'success' => true,
            'message' => 'Karyawan berhasil didaftarkan',
            'id' => (int) $stmt->insert_id,
        ], 201);
    }

    if ($method === 'DELETE') {
        $id = (int) ($_GET['id'] ?? 0);
        if ($id <= 0) {
            json_response(['success' => false, 'message' => 'ID tidak valid'], 400);
        }
        $stmt = db()->prepare('UPDATE karyawan SET aktif = 0 WHERE id = ?');
        $stmt->bind_param('i', $id);
        $stmt->execute();
        json_response(['success' => true, 'message' => 'Karyawan dinonaktifkan']);
    }

    json_response(['success' => false, 'message' => 'Method tidak didukung'], 405);
} catch (Throwable $e) {
    json_response(['success' => false, 'message' => 'Kesalahan server: ' . $e->getMessage()], 500);
}

function save_base64_image(string $dataUrl, string $prefix): string
{
    $dir = __DIR__ . '/../uploads/' . $prefix;
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    [, $data] = explode('base64,', $dataUrl, 2);
    $binary = base64_decode($data, true);
    if ($binary === false) {
        throw new RuntimeException('Gambar tidak valid');
    }
    $filename = $prefix . '_' . date('YmdHis') . '_' . bin2hex(random_bytes(4)) . '.jpg';
    $path = $dir . '/' . $filename;
    file_put_contents($path, $binary);
    return 'uploads/' . $prefix . '/' . $filename;
}
