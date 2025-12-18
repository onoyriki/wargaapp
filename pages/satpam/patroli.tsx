
import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { collection, query, where, getDocs, orderBy, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { useAuth } from '../../lib/hooks';
import { withAuth } from '../../components/withAuth';
import Layout from '../../components/Layout';
import { useStaticData } from '../../lib/useStaticData';
import { FaCamera, FaCheckCircle, FaExclamationTriangle, FaMapMarkerAlt, FaSpinner, FaSun, FaMoon, FaUndo } from 'react-icons/fa';
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
    shift: 'Pagi' | 'Malam';
};

const PatroliSatpam = () => {
    const { userData, user } = useAuth();
    const [shift, setShift] = useState<'Pagi' | 'Malam' | null>(null);

    const cpQuery = query(collection(db, 'patrol_checkpoints'), where('aktif', '==', true), orderBy('urutan', 'asc'));
    const { data: checkpoints, loading: loadingCP } = useStaticData<Checkpoint>(cpQuery, {
        key: 'patrol_checkpoints',
        ttl: 24 * 60 * 60 * 1000 // 24 hours
    });

    const [logs, setLogs] = useState<PatrolLog[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [activeCheckpoint, setActiveCheckpoint] = useState<Checkpoint | null>(null);
    const [foto, setFoto] = useState<File | null>(null);
    const [kondisi, setKondisi] = useState<'Aman' | 'Ada Temuan'>('Aman');
    const [catatan, setCatatan] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchLogs = async (currentShift: 'Pagi' | 'Malam') => {
        if (!currentShift) return;
        setLoadingLogs(true);
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayTimestamp = Timestamp.fromDate(today);

            const logQuery = query(
                collection(db, 'patrol_logs'),
                where('timestamp', '>=', todayTimestamp),
                where('shift', '==', currentShift)
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
        if (shift) {
            fetchLogs(shift);
        }
    }, [shift]);

    const loading = loadingCP || loadingLogs;

    const handleCreateLog = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeCheckpoint || !foto || !user || !shift) return;

        setUploading(true);
        try {
            const options = {
                maxSizeMB: 0.5,
                maxWidthOrHeight: 1280,
                useWebWorker: true,
                fileType: 'image/webp'
            };
            const compressedFile = await imageCompression(foto, options);

            const fileName = `patrol/${Date.now()}_${activeCheckpoint.id}.webp`;
            const storageRef = ref(storage, fileName);
            await uploadBytes(storageRef, compressedFile);
            const fotoUrl = await getDownloadURL(storageRef);

            await addDoc(collection(db, 'patrol_logs'), {
                checkpointId: activeCheckpoint.id,
                checkpointName: activeCheckpoint.nama,
                petugasId: user.uid,
                petugasName: userData?.nama || user.email,
                timestamp: serverTimestamp(),
                shift: shift, // <-- Menyimpan informasi shift
                fotoUrl,
                kondisi,
                catatan
            });

            setActiveCheckpoint(null);
            setFoto(null);
            setCatatan('');
            setKondisi('Aman');
            fetchLogs(shift);
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

    const renderShiftSelection = () => (
        <div className={styles.shiftSelection}>
            <h2>Pilih Shift Patroli</h2>
            <div className={styles.shiftButtons}>
                <button onClick={() => setShift('Pagi')}>
                    <FaSun /> Mulai Patroli Pagi
                </button>
                <button onClick={() => setShift('Malam')}>
                    <FaMoon /> Mulai Patroli Malam
                </button>
            </div>
        </div>
    );

    return (
        <Layout>
            <Head><title>Patroli - Satpam WargaKoba</title></Head>
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1>Patroli Keamanan</h1>
                    <p className={styles.subtitle}>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </header>

                {!shift ? renderShiftSelection() : (
                    <>
                        <div className={styles.shiftHeader}>
                            <h3>Shift: {shift}</h3>
                            <button onClick={() => setShift(null)} className={styles.changeShiftBtn}>
                                <FaUndo /> Ganti Shift
                            </button>
                        </div>

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
                                                    <span className={styles.statusBadge}>Sudah Dicek (Shift {shift})</span>
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
                    </>
                )}

                {activeCheckpoint && (
                    <div className={styles.modalOverlay}>
                        <div className={styles.modal}>
                            <div className={styles.modalHeader}>
                                <h2>Check Point: {activeCheckpoint.nama}</h2>
                                <button onClick={() => setActiveCheckpoint(null)} className={styles.closeBtn}>&times;</button>
                            </div>
                            <form onSubmit={handleCreateLog} className={styles.modalForm}>

                                <div className={styles.inputGroup}>
                                    <label>Foto Bukti</label>
                                    <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={(e) => setFoto(e.target.files?.[0] || null)} hidden />
                                    <div className={styles.photoPlaceholder} onClick={() => fileInputRef.current?.click()} style={{ backgroundImage: foto ? `url(${URL.createObjectURL(foto)})` : 'none' }}>
                                        {!foto && <><FaCamera size={32} /><span>Ketuk untuk ambil foto</span></>}
                                    </div>
                                </div>

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

                                <div className={styles.inputGroup}>
                                    <label>Catatan (Opsional)</label>
                                    <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={3} placeholder="Jelaskan situasi jika perlu..." />
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

export default withAuth(PatroliSatpam, ['satpam', 'admin']);
