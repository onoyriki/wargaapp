# Blueprint Aplikasi WargaKoba

Dokumen ini menguraikan arsitektur, fitur, dan rencana pengembangan untuk aplikasi WargaKoba.

## Ringkasan

WargaKoba adalah solusi digital terintegrasi yang dirancang untuk memodernisasi dan menyederhanakan manajemen data warga di lingkungan perumahan. Aplikasi ini menyediakan platform terpusat untuk administrator, satpam, dan warga untuk berinteraksi dengan data komunitas, meningkatkan efisiensi, keamanan, dan komunikasi.

## Rencana Pengembangan Terakhir: Modul Iuran & Laporan Keuangan

**Tujuan:** Mengimplementasikan sistem terintegrasi bagi Admin untuk mengelola tagihan iuran warga dan bagi warga untuk melihat status pembayaran mereka. Ini juga akan mencakup halaman laporan keuangan sederhana untuk admin.

**Rencana Implementasi:**

1.  **Sisi Administrator:**
    *   **Halaman "Kelola Iuran" (`/admin/kelola-iuran`):** Membuat antarmuka untuk generate tagihan bulanan per KK, melihat status pembayaran, dan mengubah status secara manual (Lunas/Belum Lunas).
    *   **Halaman "Laporan Keuangan" (`/admin/laporan-keuangan`):** Membuat halaman yang menampilkan ringkasan pemasukan iuran, total tagihan, dan persentase pembayaran, lengkap dengan grafik tren bulanan.

2.  **Sisi Warga:**
    *   **Halaman "Status Iuran" (`/iuran-saya`):** Membuat halaman bagi Kepala Keluarga untuk melihat riwayat dan status pembayaran iuran keluarga mereka.

3.  **Navigasi:**
    *   Menambahkan tautan navigasi ke semua halaman baru ini di dalam menu aplikasi untuk peran pengguna yang sesuai.

## Fitur yang Telah Diimplementasikan

- **Otentikasi Pengguna:** Sistem login dan registrasi yang aman menggunakan Firebase Authentication, termasuk **Login dengan Google**.
- **Manajemen Peran:** Sistem berbasis peran (`admin`, `satpam`, `warga`) untuk mengontrol akses ke berbagai fitur.
- **Verifikasi Pengguna:** Alur kerja di mana pendaftaran pengguna baru (baik manual maupun via Google) harus disetujui oleh admin.
- **Manajemen Profil & Keluarga:** Alur kerja lengkap bagi warga untuk mengelola profil pribadi sebagai "Kepala Keluarga" dan menambahkan anggota keluarga ke dalam KK mereka.
- **Pembatasan Akses Data Warga:** Pengguna dengan peran 'warga' hanya dapat melihat data anggota keluarga yang terdaftar dalam Kartu Keluarga (KK) yang sama.
- **Input Gender pada Profil:** Penambahan input jenis kelamin pada formulir profil untuk memastikan akurasi data demografi.
- **Manajemen Data Warga (CRUD untuk Admin):** Antarmuka tabel untuk admin melihat, menambah, mengedit, dan menghapus data seluruh warga.
- **Dasbor Grafik Interaktif:** Dasbor admin menampilkan visualisasi data demografi warga.
- **Iklan Komunitas:** Fitur bagi warga untuk memposting iklan di dasbor mereka.
- **Laporan Patroli:** Halaman untuk melihat catatan patroli keamanan dari satpam.
- **Deployment CI/CD:** Alur kerja deployment otomatis dari GitHub ke Firebase App Hosting.
