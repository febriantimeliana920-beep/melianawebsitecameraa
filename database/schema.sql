-- Database: absensi_wajah
-- Import via phpMyAdmin atau: mysql -u root < database/schema.sql

CREATE DATABASE IF NOT EXISTS absensi_wajah
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE absensi_wajah;

CREATE TABLE IF NOT EXISTS karyawan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nip VARCHAR(20) NOT NULL UNIQUE,
  nama VARCHAR(100) NOT NULL,
  jabatan VARCHAR(80) DEFAULT NULL,
  face_descriptor JSON NOT NULL COMMENT 'Array 128 float dari face-api',
  foto_path VARCHAR(255) DEFAULT NULL,
  aktif TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS absensi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  karyawan_id INT NOT NULL,
  tipe ENUM('masuk', 'keluar') NOT NULL,
  waktu TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confidence DECIMAL(5,4) DEFAULT NULL COMMENT 'Skor kecocokan wajah',
  foto_snapshot VARCHAR(255) DEFAULT NULL,
  FOREIGN KEY (karyawan_id) REFERENCES karyawan(id) ON DELETE CASCADE,
  INDEX idx_karyawan_tanggal (karyawan_id, waktu),
  INDEX idx_waktu (waktu)
) ENGINE=InnoDB;
