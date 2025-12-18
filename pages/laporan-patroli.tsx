
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { collection, query, where, getDocs, orderBy, Timestamp, Query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { withAuth } from '../components/withAuth';
import Layout from '../components/Layout';
import { FaCalendarAlt, FaCheckCircle, FaExclamationTriangle, FaUserSecret, FaMapMarkerAlt, FaSun, FaMoon } from 'react-icons/fa';
import styles from '../styles/LaporanPatroli.module.css';

interface PatrolLog {
    id: string;
    checkpointName: string;
    petugasName: string;
    timestamp: Timestamp;
    fotoUrl: string;
    kondisi: 'Aman' | 'Ada Temuan';
    catatan?: string;
    shift?: 'Pagi' | 'Malam'; // Shift is now optional
}

const LaporanPatroliPage = () => {
    const [logs, setLogs] = useState<PatrolLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(''); // Initialize empty
    const [selectedShift, setSelectedShift] = useState<'Pagi' | 'Malam'>('Pagi');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Set initial date on the client-side to avoid timezone issues
    useEffect(() => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-11
        const dd = String(today.getDate()).padStart(2, '0');
        setSelectedDate(`${yyyy}-${mm}-${dd}`);
    }, []);

    const getTodayString = () => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const isLegacyDate = selectedDate < getTodayString() && selectedDate !== '';

    useEffect(() => {
        // Don't fetch if the date hasn't been set yet
        if (!selectedDate) {
            return;
        }

        const fetchLogs = async () => {
            setLoading(true);
            try {
                const start = new Date(selectedDate);
                start.setHours(0, 0, 0, 0);
                const end = new Date(selectedDate);
                end.setHours(23, 59, 59, 999);

                let q: Query;

                if (isLegacyDate) {
                    q = query(
                        collection(db, 'patrol_logs'),
                        where('timestamp', '>=', Timestamp.fromDate(start)),
                        where('timestamp', '<=', Timestamp.fromDate(end)),
                        orderBy('timestamp', 'desc')
                    );
                } else {
                    q = query(
                        collection(db, 'patrol_logs'),
                        where('timestamp', '>=', Timestamp.fromDate(start)),
                        where('timestamp', '<=', Timestamp.fromDate(end)),
                        where('shift', '==', selectedShift),
                        orderBy('timestamp', 'desc')
                    );
                }

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
    }, [selectedDate, selectedShift, isLegacyDate]);

    return (
        <Layout>
            <Head><title>Laporan Patroli - WargaKoba</title></Head>
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1>Laporan Patroli Keamanan</h1>
                    <div className={styles.filters}>
                        <div className={styles.filterControl}>
                            <FaCalendarAlt className={styles.icon} />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className={styles.dateInput}
                            />
                        </div>
                        {!isLegacyDate && (
                             <div className={styles.shiftToggle}>
                                <button 
                                    className={`${styles.shiftButton} ${selectedShift === 'Pagi' ? styles.activeShift : ''}`}
                                    onClick={() => setSelectedShift('Pagi')}
                                >
                                    <FaSun /> Shift Pagi
                                </button>
                                <button 
                                    className={`${styles.shiftButton} ${selectedShift === 'Malam' ? styles.activeShift : ''}`}
                                    onClick={() => setSelectedShift('Malam')}
                                >
                                    <FaMoon /> Shift Malam
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                {loading || !selectedDate ? <div className={styles.loading}>Memuat laporan...</div> : (
                    <div className={styles.timelineContainer}>
                        {logs.length === 0 ? (
                            <div className={styles.emptyState}>
                                {isLegacyDate 
                                    ? <p>Tidak ada aktivitas patroli pada tanggal ini.</p>
                                    : <p>Tidak ada aktivitas patroli untuk shift <strong>{selectedShift}</strong> pada tanggal ini.</p>
                                }
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
                                                {log.shift && <span className={styles.shiftTag}>Shift {log.shift}</span>}
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

export default withAuth(LaporanPatroliPage, ['warga', 'admin', 'satpam']);
