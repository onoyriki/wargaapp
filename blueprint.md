# Blueprint Aplikasi Cluster Koba Village Purwakarta

Dokumen ini menguraikan arsitektur, fitur, dan rencana pengembangan untuk aplikasi manajemen warga perumahan Cluster Koba Village Purwakarta.

## Ringkasan

Cluster Koba Village Purwakarta (sebelumnya WargaKoba) adalah solusi digital terintegrasi yang dirancang untuk memodernisasi dan menyederhanakan manajemen data warga di lingkungan perumahan. Aplikasi ini menyediakan platform terpusat untuk administrator, satpam, dan warga untuk berinteraksi dengan data komunitas, meningkatkan efisiensi, keamanan, dan komunikasi.

## Pengembangan Terakhir & Milestone Penting

**Tujuan:** Meningkatkan integritas data, keamanan akses, dan pengalaman pengguna melalui personalisasi dan otomasi manajemen akun.

**Pembaruan Utama:**

1.  **Rebranding & UI Rejuvenation:**
    *   Perubahan nama aplikasi menjadi **Cluster Koba Village Purwakarta**.
    *   Redesain Landing Page dengan tata letak split 70/30 (Visual Content / Login Form) yang modern.
    *   Implementasi grid pengumuman dan iklan yang dinamis dengan gambar di halaman depan.
    *   Optimalisasi UI verifikasi admin dan monitor dashboard.

2.  **Manajemen Pengguna & Keamanan:**
    *   Penyederhanaan metode masuk dengan menghapus Google Sign-In (fokus pada Email/Password).
    *   Implementasi sistem verifikasi admin yang komprehensif (User Management, Role Management).
    *   Penghapusan otomatis akun Firebase Auth saat data pengguna dihapus dari sistem.
    *   Sinkronisasi data `noKK` dan `alamatBlok` ke koleksi `users` untuk penguatan Security Rules Firestore.
    *   Implementasi halaman `/laporan-keamanan` yang dapat diakses oleh Admin dan Satpam (Laporan Serah Terima & Buku Tamu).

3.  **Fitur Keluarga & Profil:**
    *   Penambahan fitur "Tambah Anggota Keluarga" bagi warga untuk kelola mandiri.
    *   Validasi NIK unik secara sistem untuk mencegah duplikasi data.
    *   Personalitas data dengan penambahan field `agama` dan `jenisKelamin`.
    *   Sistem redirect paksa: Warga yang belum melengkapi profil (terutama No. KK) akan diarahkan langsung ke halaman profil sebelum bisa mengakses dashboard.

4.  **Optimalisasi Media:**
    *   Implementasi kompresi gambar otomatis ke format WebP untuk efisiensi penyimpanan dan kecepatan akses.

## Arsitektur

*   **Framework:** Next.js dengan Pages Router
*   **PWA:** Diimplementasikan menggunakan `next-pwa`
*   **Authentication:** Firebase Authentication (Email/Password)
*   **Database:** Firestore dengan Security Rules berbasis Role dan KK.
*   **Storage:** Firebase Storage (dengan optimasi format WebP).
*   **Styling:** CSS Modules dan Global Styles berbasis Vanilla CSS.

## Skema Database & Keamanan

Struktur database saat ini dirancang untuk memastikan integritas data dan fungsionalitas aplikasi yang aman.

### Koleksi Firestore

| Koleksi | Deskripsi | Field Utama |
| :--- | :--- | :--- |
| `users` | Data otentikasi & keamanan | `email`, `role`, `verified`, `noKK`, `alamatBlok` |
| `warga` | Profil detail warga & keluarga | `nama`, `nik`, `noKK`, `email`, `statusHubungan`, `alamatBlok`, `agama`, `jenisKelamin`, `tanggalLahir` |
| `iuran` | Catatan pembayaran iuran | `noKK`, `bulan`, `tahun`, `jumlah`, `status`, `tanggalBayar` |
| `patrol_checkpoints` | Daftar titik patroli | `nama`, `urutan`, `aktif` |
| `patrol_logs` | Catatan aktivitas patroli | `checkpointId`, `status`, `waktu`, `petugas`, `keterangan` |
| `buku_tamu` | Data pengunjung | `nama`, `tujuan`, `keperluan`, `fotoKtpUrl`, `waktuMasuk`, `waktuKeluar` |
| `serah_terima` | Log serah terima shift | `penerima`, `menyerahkan`, `kondisi`, `kejadian`, `createdAt` |
| `pengumuman` | Konten pengumuman | `judul`, `isi`, `penulis`, `images`, `createdAt` |
| `iklan` | Konten iklan komunitas | `judul`, `isi`, `penulis`, `images`, `createdAt` |

### Integritas & Keamanan

1.  **Role-Based Access Control (RBAC):**
    *   **Admin:** Akses penuh (CRUD) melalui modul verifikasi dan manajemen pengguna khusus.
    *   **Satpam:** Akses operasional keamanan (`patrol_logs`, `buku_tamu`, `serah_terima`).
    *   **Warga:** Akses baca iuran sendiri, kelola keluarga sendiri (berdasarkan kesamaan `noKK`), serta akses pengumuman/iklan.
2.  **Validasi KK Mandatori:** Data `noKK` menjadi kunci utama (foreign key de facto) untuk mengaitkan data iuran, keluarga, dan izin akses.

## Fitur yang Telah Diimplementasikan

### Fitur Umum
-   **Landing Page Modern:** Tampilan visual 70% konten dan 30% login yang responsif.
-   **PWA:** Dapat diinstal di HP/Desktop dan diakses cepat.
-   **Otentikasi Aman:** Sistem Email/Password dengan fitur Lupa Password.

### Fitur Admin
-   **Verifikasi Terpusat:** Manajemen registrasi warga baru dan pengaturan peran.
-   **Manajemen Warga & KK:** CRUD data warga dan monitoring kelengkapan data keluarga.
-   **Laporan Keamanan Terpusat:** Sistem tab untuk Serah Terima dan Buku Tamu.
-   **Manajemen Keuangan:** Kelola iuran dan monitoring tunggakan warga.
-   **Manajemen Titik Patroli:** CRUD data titik patroli dengan pengaturan urutan (sequence) custom untuk satpam.
-   **Manajemen Konten:** Dashboard untuk posting pengumuman dan iklan dengan dukungan upload banyak gambar & kompresi WebP.
-   **Pemeliharaan Database:** Halaman maintenance untuk backup data ke JSON dan pembersihan otomatis log lama (Firestore & Storage).

### Fitur Warga
-   **Dashboard Terpadu:** Melihat info iuran terbaru, pengumuman, dan iklan dalam satu layar.
-   **Kelola Keluarga:** Menambah/mengedit data anggota keluarga yang terdaftar dalam satu KK.
-   **Profil Mandiri:** Mewajibkan kelengkapan data sebelum akses fitur lainnya.

### Fitur Satpam
-   **Operasional Digital:** Log patroli, buku tamu digital (foto KTP), dan serah terima shift yang terdokumentasi rapi.

