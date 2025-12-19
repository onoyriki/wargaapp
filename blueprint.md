# Blueprint Aplikasi WargaKoba

Dokumen ini menguraikan arsitektur, fitur, dan rencana pengembangan untuk aplikasi WargaKoba.

## Ringkasan

WargaKoba adalah solusi digital terintegrasi yang dirancang untuk memodernisasi dan menyederhanakan manajemen data warga di lingkungan perumahan. Aplikasi ini menyediakan platform terpusat untuk administrator, satpam, dan warga untuk berinteraksi dengan data komunitas, meningkatkan efisiensi, keamanan, dan komunikasi.

## Rencana Pengembangan Terakhir: Penggabungan Menu Laporan Keamanan

**Tujuan:** Merampingkan antarmuka admin dengan mengkonsolidasikan laporan-laporan terkait keamanan ke dalam satu halaman terpusat untuk meningkatkan efisiensi dan kemudahan navigasi.

**Perubahan Desain Final:**

1.  **Membuat Halaman Laporan Terpusat:**
    *   Membuat satu halaman utama baru di `pages/admin/laporan-keamanan.tsx` yang berfungsi sebagai hub untuk semua laporan keamanan.
    *   Mengimplementasikan sistem navigasi berbasis *tab* di halaman tersebut, memungkinkan admin untuk beralih antara "Laporan Serah Terima" dan "Laporan Buku Tamu" tanpa berpindah halaman.

2.  **Refaktorisasi Menjadi Komponen:**
    *   Mengubah halaman `laporan-serah-terima.tsx` dan `laporan-buku-tamu.tsx` menjadi komponen React yang dapat digunakan kembali (`components/LaporanSerahTerima.tsx` dan `components/LaporanBukuTamu.tsx`).
    *   Komponen-komponen ini kemudian diimpor dan ditampilkan secara dinamis di dalam *tab* pada halaman laporan terpusat.

3.  **Pembaruan Navigasi Utama:**
    *   Memodifikasi `components/Layout.tsx` untuk menghapus dua tautan menu laporan yang lama dari sidebar admin.
    *   Menggantinya dengan satu tautan tunggal, **"Laporan Keamanan"**, yang mengarah ke halaman terpusat yang baru.

4.  **Pembersihan Kode:** Menghapus file halaman `pages/admin/laporan-serah-terima.tsx` dan `pages/admin/laporan-buku-tamu.tsx` yang sudah tidak relevan untuk menjaga kebersihan struktur proyek.

**Hasil:** Antarmuka admin kini lebih rapi dan intuitif. Mengakses berbagai jenis laporan keamanan menjadi lebih cepat dan efisien, mengurangi jumlah klik dan menyederhanakan alur kerja admin.

## Arsitektur

*   **Framework:** Next.js dengan Pages Router
*   **PWA:** Diimplementasikan menggunakan `next-pwa`
*   **Authentication:** Firebase Authentication (Email/Password dan Google Sign-In)
*   **Database:** Firestore
*   **Storage:** Firebase Storage untuk file upload (e.g., foto KTP)
*   **Styling:** CSS Modules dan Global Styles

## Fitur yang Telah Diimplementasikan

### Fitur Umum

-   **Progressive Web App (PWA):** Dapat diinstal dan diakses secara offline.
-   **Otentikasi & Peran:** Login/Registrasi aman dengan peran (`admin`, `satpam`, `warga`).
-   **Reset Kata Sandi & Login Google:** Opsi pemulihan akun dan login alternatif.
-   **Deployment CI/CD:** Alur kerja deployment otomatis.

### Fitur Admin

-   **Dashboard:** Ringkasan dan statistik.
-   **Manajemen Warga:** CRUD untuk data warga.
-   **Verifikasi & Integritas Data:** Antarmuka terpusat (dalam B. Indonesia) untuk persetujuan pengguna dan validasi kelengkapan data.
-   **Manajemen Keuangan:** Kelola iuran dan lihat laporan keuangan.
-   **Manajemen Konten:** Kelola pengumuman dan iklan.
-   **Manajemen Patroli:** Kelola titik patroli.
-   **Laporan Keamanan Terpusat:** Antarmuka tunggal dengan sistem tab untuk meninjau "Laporan Serah Terima Shift" dan "Laporan Buku Tamu", lengkap dengan fungsi filter dan pencarian.
-   **Monitoring:** Memantau aktivitas sistem.

### Fitur Warga

-   **Dashboard:** Melihat pengumuman penting dan iklan komunitas dalam satu tampilan terpadu.
-   **Profil & Keluarga:** Mengelola profil pribadi dan data anggota keluarga. Warga diwajibkan (dipaksa) melengkapi profil (terutama No. KK) sebelum dapat mengakses dashboard.
-   **Iuran & Keuangan:** Melihat riwayat dan status pembayaran iuran.
-   **Informasi Lingkungan:** Melihat laporan patroli dan data keluarga.

### Fitur Satpam

-   **Dashboard:** Akses cepat ke fungsi utama.
-   **Patroli:** Memulai patroli berbasis shift dan mengirimkan laporan checklist.
-   **Serah Terima Shift:** Mengisi formulir serah terima di akhir shift untuk mendokumentasikan kondisi dan kejadian.
-   **Buku Tamu:** Mencatat data tamu yang masuk, termasuk upload foto KTP untuk verifikasi.
-   **Laporan:** Mengakses kembali laporan patroli yang telah dikirim.
