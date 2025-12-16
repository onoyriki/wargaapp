
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { withAuth } from '../components/withAuth';
import Layout from '../components/Layout';
import { FaCalendarAlt, FaCheckCircle, FaExclamationTriangle, FaUserSecret, FaMapMarkerAlt } from 'react-icons/fa';
import styles from '../styles/LaporanPatroli.module.css';

// Fix: Rename interface to avoid conflict or confusion
interface PatrolLog {
    id: string;
    checkpointName: string;
    petugasName: string;
    timestamp: Timestamp;
    fotoUrl: string;
    kondisi: 'Aman' | 'Ada Temuan';
    catatan?: string;
}

const LaporanPatroliPage = () => {
    const [logs, setLogs] = useState<PatrolLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                // Create date range for query
                const start = new Date(selectedDate);
                start.setHours(0, 0, 0, 0);
                const end = new Date(selectedDate);
                end.setHours(23, 59, 59, 999);

                const q = query(
                    collection(db, 'patrol_logs'),
                    where('timestamp', '>=', Timestamp.fromDate(start)),
                    where('timestamp', '<=', Timestamp.fromDate(end)),
                    orderBy('timestamp', 'desc')
                );

                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PatrolLog));
                setLogs(data);
            } catch (err) {
                console.error("Error fetching logs:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, [selectedDate]);

    return (
        <Layout>
            <Head><title>Laporan Patroli - WargaKoba</title></Head>
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1>Laporan Patroli Keamanan</h1>
                    <div className={styles.filterControl}>
                        <FaCalendarAlt className={styles.icon} />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className={styles.dateInput}
                        />
                    </div>
                </header>

                {loading ? <div className={styles.loading}>Memuat laporan...</div> : (
                    <div className={styles.timelineContainer}>
                        {logs.length === 0 ? (
                            <div className={styles.emptyState}>
                                <p>Tidak ada aktivitas patroli pada tanggal ini.</p>
                            </div>
                        ) : (
                            <div className={styles.timeline}>
                                {logs.map((log) => (
                                    <div key={log.id} className={`${styles.logCard} ${log.kondisi === 'Ada Temuan' ? styles.warningCard : ''}`}>
                                        <div className={styles.timeBadge}>
                                            {log.timestamp.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        </div>

                                        <div className={styles.content}>
                                            <div className={styles.topRow}>
                                                <h3 className={styles.checkpointName}>
                                                    <FaMapMarkerAlt /> {log.checkpointName}
                                                </h3>
                                                <span className={`${styles.statusBadge} ${log.kondisi === 'Aman' ? styles.statusAman : styles.statusTemuan}`}>
                                                    {log.kondisi === 'Aman' ? <FaCheckCircle /> : <FaExclamationTriangle />} {log.kondisi}
                                                </span>
                                            </div>

                                            <div className={styles.details}>
                                                <p className={styles.petugas}>
                                                    <FaUserSecret /> {log.petugasName}
                                                </p>
                                                {log.catatan && <p className={styles.catatan}>"{log.catatan}"</p>}
                                            </div>

                                            {log.fotoUrl && (
                                                <div className={styles.imageContainer} onClick={() => setSelectedImage(log.fotoUrl)}>
                                                    <img src={log.fotoUrl} alt="Bukti Patroli" loading="lazy" />
                                                    <div className={styles.zoomHint}>Klik untuk perbesar</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Image Modal */}
                {selectedImage && (
                    <div className={styles.modalOverlay} onClick={() => setSelectedImage(null)}>
                        <div className={styles.modalContent}>
                            <img src={selectedImage} alt="Detail" />
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

// Allow 'warga', 'admin', 'satpam' to view
export default withAuth(LaporanPatroliPage, ['warga', 'admin', 'satpam']);
