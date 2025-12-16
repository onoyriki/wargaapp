
import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { collection, query, where, getDocs, orderBy, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { useAuth } from '../../lib/hooks';
import { withAuth } from '../../components/withAuth';
import Layout from '../../components/Layout';
import { useStaticData } from '../../lib/useStaticData';
import { FaCamera, FaCheckCircle, FaExclamationTriangle, FaMapMarkerAlt, FaSpinner } from 'react-icons/fa';
import styles from '../../styles/PatroliSatpam.module.css';
import imageCompression from 'browser-image-compression';

type Checkpoint = {
    id: string;
    nama: string;
    deskripsi: string;
    urutan: number;
};

type PatrolLog = {
    checkpointId: string;
    timestamp: Timestamp;
    kondisi: 'Aman' | 'Ada Temuan';
};

const PatroliSatpam = () => {
    const { userData, user } = useAuth();

    // 1. Get Active Checkpoints (Static Data with LocalStorage)
    const cpQuery = query(collection(db, 'patrol_checkpoints'), where('aktif', '==', true), orderBy('urutan', 'asc'));
    const { data: checkpoints, loading: loadingCP } = useStaticData<Checkpoint>(cpQuery, {
        key: 'patrol_checkpoints',
        ttl: 24 * 60 * 60 * 1000 // 24 hours
    });

    // 2. Logs (Dynamic Data)
    const [logs, setLogs] = useState<PatrolLog[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Modal State
    const [activeCheckpoint, setActiveCheckpoint] = useState<Checkpoint | null>(null);
    const [foto, setFoto] = useState<File | null>(null);
    const [kondisi, setKondisi] = useState<'Aman' | 'Ada Temuan'>('Aman');
    const [catatan, setCatatan] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchLogs = async () => {
        setLoadingLogs(true);
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayTimestamp = Timestamp.fromDate(today);

            const logQuery = query(
                collection(db, 'patrol_logs'),
                where('timestamp', '>=', todayTimestamp)
            );

            const logSnap = await getDocs(logQuery);
            const logData = logSnap.docs.map(d => d.data() as PatrolLog);
            setLogs(logData);
        } catch (err) {
            console.error("Error fetching logs:", err);
        } finally {
            setLoadingLogs(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const loading = loadingCP || loadingLogs;

    const handleCreateLog = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeCheckpoint || !foto || !user) return; // Check user instead of userData for ID

        setUploading(true);
        try {
            // 1. Compress Image
            const options = {
                maxSizeMB: 0.5, // Max 500KB
                maxWidthOrHeight: 1280,
                useWebWorker: true,
                fileType: 'image/webp'
            };
            const compressedFile = await imageCompression(foto, options);
            console.log(`Original: ${foto.size / 1024} KB, Compressed: ${compressedFile.size / 1024} KB`);

            // 2. Upload Photo (WebP)
            const fileName = `patrol/${Date.now()}_${activeCheckpoint.id}.webp`;
            const storageRef = ref(storage, fileName);
            await uploadBytes(storageRef, compressedFile);
            const fotoUrl = await getDownloadURL(storageRef);

            // 3. Create Log Entry
            await addDoc(collection(db, 'patrol_logs'), {
                checkpointId: activeCheckpoint.id,
                checkpointName: activeCheckpoint.nama,
                petugasId: user.uid, // Use user.uid from Firebase Auth
                petugasName: userData?.nama || user.email,
                timestamp: serverTimestamp(),
                fotoUrl,
                kondisi,
                catatan
            });

            // 3. Reset & Refresh
            setActiveCheckpoint(null);
            setFoto(null);
            setCatatan('');
            setKondisi('Aman');
            setKondisi('Aman');
            fetchLogs(); // Refresh logs only, checkpoints stay cached
        } catch (err) {
            console.error(err);
            alert("Gagal mengirim laporan patroli: " + err);
        } finally {
            setUploading(false);
        }
    };

    const openCheckModal = (cp: Checkpoint) => {
        setActiveCheckpoint(cp);
        setFoto(null);
        setKondisi('Aman');
        setCatatan('');
    };

    const isChecked = (cpId: string) => {
        return logs.some(log => log.checkpointId === cpId);
    };

    return (
        <Layout>
            <Head><title>Patroli - Satpam WargaKoba</title></Head>
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1>Patroli Keamanan</h1>
                    <p className={styles.subtitle}>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </header>

                {loading ? <div className={styles.loading}>Memuat data...</div> : (
                    <div className={styles.timeline}>
                        {checkpoints.map((cp, index) => {
                            const done = isChecked(cp.id);
                            return (
                                <div key={cp.id} className={`${styles.card} ${done ? styles.cardDone : ''}`}>
                                    <div className={styles.cardIcon}>
                                        {done ? <FaCheckCircle /> : <div className={styles.numberBadge}>{index + 1}</div>}
                                    </div>
                                    <div className={styles.cardContent}>
                                        <h3>{cp.nama}</h3>
                                        <p>{cp.deskripsi || "Tidak ada deskripsi khusus"}</p>
                                        {done ? (
                                            <span className={styles.statusBadge}>Sudah Dicek</span>
                                        ) : (
                                            <button onClick={() => openCheckModal(cp)} className={styles.checkButton}>
                                                <FaMapMarkerAlt /> Check-In
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Modal for Check-In */}
                {activeCheckpoint && (
                    <div className={styles.modalOverlay}>
                        <div className={styles.modal}>
                            <div className={styles.modalHeader}>
                                <h2>Check Point: {activeCheckpoint.nama}</h2>
                                <button onClick={() => setActiveCheckpoint(null)} className={styles.closeBtn}>&times;</button>
                            </div>
                            <form onSubmit={handleCreateLog} className={styles.modalForm}>

                                {/* Foto Section */}
                                <div className={styles.inputGroup}>
                                    <label>Foto Bukti</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        ref={fileInputRef}
                                        onChange={(e) => setFoto(e.target.files?.[0] || null)}
                                        hidden
                                    />
                                    <div
                                        className={styles.photoPlaceholder}
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{ backgroundImage: foto ? `url(${URL.createObjectURL(foto)})` : 'none' }}
                                    >
                                        {!foto && (
                                            <>
                                                <FaCamera size={32} />
                                                <span>Ketuk untuk ambil foto</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Kondisi Section */}
                                <div className={styles.inputGroup}>
                                    <label>Kondisi</label>
                                    <div className={styles.radioGroup}>
                                        <label className={`${styles.radioOption} ${kondisi === 'Aman' ? styles.selectedAman : ''}`}>
                                            <input type="radio" name="kondisi" value="Aman" checked={kondisi === 'Aman'} onChange={() => setKondisi('Aman')} />
                                            <FaCheckCircle /> Aman
                                        </label>
                                        <label className={`${styles.radioOption} ${kondisi === 'Ada Temuan' ? styles.selectedTemuan : ''}`}>
                                            <input type="radio" name="kondisi" value="Ada Temuan" checked={kondisi === 'Ada Temuan'} onChange={() => setKondisi('Ada Temuan')} />
                                            <FaExclamationTriangle /> Ada Temuan
                                        </label>
                                    </div>
                                </div>

                                {/* Catatan Section */}
                                <div className={styles.inputGroup}>
                                    <label>Catatan (Opsional)</label>
                                    <textarea
                                        value={catatan}
                                        onChange={(e) => setCatatan(e.target.value)}
                                        rows={3}
                                        placeholder="Jelaskan situasi jika perlu..."
                                    />
                                </div>

                                <button type="submit" className={styles.submitBtn} disabled={!foto || uploading}>
                                    {uploading ? <><FaSpinner className="spin" /> Mengirim...</> : 'Kirim Laporan'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default withAuth(PatroliSatpam, ['satpam', 'admin']); // Admin juga boleh test
