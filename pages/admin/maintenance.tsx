
import { useState, useEffect } from 'react';
import Head from 'next/head';
import {
    collection,
    getDocs,
    query,
    where,
    deleteDoc,
    doc,
    Timestamp,
    getCountFromServer,
    orderBy,
    limit
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { withAuth } from '../../components/withAuth';
import Layout from '../../components/Layout';
import {
    FaDatabase, FaTrashAlt, FaDownload, FaExclamationTriangle,
    FaCheckCircle, FaSpinner, FaHistory
} from 'react-icons/fa';
import styles from '../../styles/Maintenance.module.css';

const MaintenancePage = () => {
    const [stats, setStats] = useState({
        patrol: 0,
        bukuTamu: 0,
        warga: 0,
        iuran: 0
    });
    const [loading, setLoading] = useState(true);

    // Cleanup state
    const [cleanupCollection, setCleanupCollection] = useState('patrol_logs');
    const [cleanupMonths, setCleanupMonths] = useState(3);
    const [isCleaning, setIsCleaning] = useState(false);
    const [cleanupProgress, setCleanupProgress] = useState(0);
    const [cleanupTotal, setCleanupTotal] = useState(0);

    // Backup state
    const [isBackingUp, setIsBackingUp] = useState(false);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const [p, bt, w, i] = await Promise.all([
                getCountFromServer(collection(db, 'patrol_logs')),
                getCountFromServer(collection(db, 'buku_tamu')),
                getCountFromServer(collection(db, 'warga')),
                getCountFromServer(collection(db, 'iuran'))
            ]);
            setStats({
                patrol: p.data().count,
                bukuTamu: bt.data().count,
                warga: w.data().count,
                iuran: i.data().count
            });
        } catch (error) {
            console.error("Error fetching maintenance stats:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleCleanup = async () => {
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - cleanupMonths);
        const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

        const q = query(
            collection(db, cleanupCollection),
            where('timestamp', '<', cutoffTimestamp)
        );

        if (cleanupCollection === 'serah_terima') {
            // Some collections use createdAt instead of timestamp
            // But let's stick to the common ones mentioned in blueprint
        }

        const snapshot = await getDocs(q);
        const total = snapshot.docs.length;

        if (total === 0) {
            alert('Tidak ada data lama yang ditemukan untuk kriteria tersebut.');
            return;
        }

        if (!confirm(`Hapus ${total} data permanen? Tindakan ini tidak dapat dibatalkan.`)) return;

        setIsCleaning(true);
        setCleanupTotal(total);
        let count = 0;

        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();

            // 1. Delete Photo if exists (handles patrol_logs and buku_tamu)
            const photoUrl = data.fotoUrl || data.fotoKtpUrl;
            if (photoUrl && photoUrl.includes('firebasestorage')) {
                try {
                    // Extract path from download URL or use ref(storage, url)
                    const fileRef = ref(storage, photoUrl);
                    await deleteObject(fileRef);
                } catch (err) {
                    console.warn("Failed to delete storage object:", err);
                }
            }

            // 2. Delete Firestore Document
            await deleteDoc(doc(db, cleanupCollection, docSnap.id));

            count++;
            setCleanupProgress(Math.round((count / total) * 100));
        }

        setIsCleaning(false);
        setCleanupProgress(0);
        alert(`Berhasil menghapus ${count} data.`);
        fetchStats();
    };

    const handleBackup = async () => {
        setIsBackingUp(true);
        try {
            const collections = ['warga', 'iuran', 'patrol_logs', 'buku_tamu', 'pengumuman', 'iklan'];
            const backupData: any = {};

            for (const colName of collections) {
                const snap = await getDocs(collection(db, colName));
                backupData[colName] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            }

            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_wargakoba_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Backup failed:", err);
            alert("Backup gagal dilaksanakan.");
        } finally {
            setIsBackingUp(false);
        }
    };

    return (
        <Layout title="Maintenance Database">
            <Head><title>Maintenance DB - Admin</title></Head>
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Pemeliharaan Database</h1>
                    <p className={styles.subtitle}>Kelola penyimpanan, bersihkan data lama, dan cadangkan informasi penting.</p>
                </header>

                <div className={styles.grid}>
                    {/* Status Card */}
                    <div className={styles.card}>
                        <div className={styles.cardIcon}><FaDatabase /></div>
                        <h3 className={styles.cardTitle}>Status Data Saat Ini</h3>
                        <div className={styles.statsGrid}>
                            <div className={styles.statItem}>
                                <div className={styles.statValue}>{stats.warga}</div>
                                <div className={styles.statLabel}>Warga</div>
                            </div>
                            <div className={styles.statItem}>
                                <div className={styles.statValue}>{stats.patrol}</div>
                                <div className={styles.statLabel}>Patroli</div>
                            </div>
                            <div className={styles.statItem}>
                                <div className={styles.statValue}>{stats.bukuTamu}</div>
                                <div className={styles.statLabel}>Buku Tamu</div>
                            </div>
                            <div className={styles.statItem}>
                                <div className={styles.statValue}>{stats.iuran}</div>
                                <div className={styles.statLabel}>Iuran</div>
                            </div>
                        </div>
                    </div>

                    {/* Cleanup Card */}
                    <div className={styles.card}>
                        <div className={styles.cardIcon} style={{ color: '#e53e3e' }}><FaTrashAlt /></div>
                        <h3 className={styles.cardTitle}>Pembersihan Data Lama</h3>
                        <p className={styles.description}>Hapus data lama untuk menghemat kuota Firestore dan Storage (File foto ikut terhapus).</p>

                        <div className={styles.formGroup}>
                            <label>Pilih Koleksi</label>
                            <select
                                className={styles.select}
                                value={cleanupCollection}
                                onChange={(e) => setCleanupCollection(e.target.value)}
                            >
                                <option value="patrol_logs">Laporan Patroli</option>
                                <option value="buku_tamu">Buku Tamu</option>
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Umur Data (Lebih dari)</label>
                            <select
                                className={styles.select}
                                value={cleanupMonths}
                                onChange={(e) => setCleanupMonths(Number(e.target.value))}
                            >
                                <option value={1}>1 Bulan</option>
                                <option value={3}>3 Bulan</option>
                                <option value={6}>6 Bulan</option>
                                <option value={12}>1 Tahun</option>
                            </select>
                        </div>

                        <button
                            className={`${styles.button} ${styles.cleanupBtn}`}
                            onClick={handleCleanup}
                            disabled={isCleaning || loading}
                        >
                            {isCleaning ? <FaSpinner className="spin" /> : <FaTrashAlt />}
                            {isCleaning ? 'Membersihkan...' : 'Mulai Pembersihan'}
                        </button>

                        {isCleaning && (
                            <div className={styles.progressContainer}>
                                <div className={styles.progressBar}>
                                    <div className={styles.progressFill} style={{ width: `${cleanupProgress}%` }}></div>
                                </div>
                                <p className={styles.progressText}>Memproses {cleanupTotal} dokumen... {cleanupProgress}%</p>
                            </div>
                        )}
                    </div>

                    {/* Backup Card */}
                    <div className={styles.card}>
                        <div className={styles.cardIcon} style={{ color: '#3182ce' }}><FaHistory /></div>
                        <h3 className={styles.cardTitle}>Backup Seluruh Data</h3>
                        <p className={styles.description}>Ekspor seluruh koleksi ke dalam satu file JSON untuk dokumentasi atau pemulihan di masa depan.</p>

                        <button
                            className={`${styles.button} ${styles.backupBtn}`}
                            onClick={handleBackup}
                            disabled={isBackingUp || loading}
                        >
                            {isBackingUp ? <FaSpinner className="spin" /> : <FaDownload />}
                            {isBackingUp ? 'Menyiapkan Data...' : 'Unduh Cadangan (JSON)'}
                        </button>
                    </div>
                </div>

                <div className={styles.card} style={{ borderColor: '#ecc94b', background: '#fffaf0' }}>
                    <h3 style={{ color: '#975a16', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaExclamationTriangle /> Perhatian Keamanan
                    </h3>
                    <p style={{ color: '#744210', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                        Tindakan pembersihan akan menghapus data secara permanen dari Google Cloud Firestore dan Firebase Storage.
                        Sangat disarankan untuk melakukan <b>Backup Data</b> terlebih dahulu sebelum memulai pembersihan.
                    </p>
                </div>
            </div>
        </Layout>
    );
};

export default withAuth(MaintenancePage, ['admin']);
