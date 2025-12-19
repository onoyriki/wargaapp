import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/hooks';
import { withAuth } from '../components/withAuth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, addDoc, doc, updateDoc, deleteDoc, query, orderBy, getDocs, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import Layout from '../components/Layout';
import AdminDashboard from '../components/AdminDashboard';
import styles from '../styles/Dashboard.module.css';
import wargaStyles from '../styles/WargaDashboard.module.css';
import { FaUserCheck, FaPlus, FaEdit, FaTrash, FaBullhorn, FaImage, FaTimes } from 'react-icons/fa';
import imageCompression from 'browser-image-compression';
import { useState, FC, FormEvent, useEffect } from 'react';

// 1. Define strict types
interface Iklan {
    id: string;
    judul: string;
    deskripsi: string;
    creatorEmail: string;
    creatorName: string;
    images?: string[];
}

interface Pengumuman {
    id: string;
    judul: string;
    isi: string;
    penulis: string;
    createdAt: any;
    images?: string[];
}

interface IklanCardProps {
    iklan: Iklan;
    onEdit: (iklan: Iklan) => void;
    onDelete: (id: string) => void;
}

interface IklanFormState {
    id: string | null;
    judul: string;
    deskripsi: string;
}

// 2. Apply types to IklanCard
const IklanCard: FC<IklanCardProps> = ({ iklan, onEdit, onDelete }) => {
    const { user, userData } = useAuth();
    const canEdit = user && userData && (userData.role === 'admin' || (userData.email && userData.email === iklan.creatorEmail));

    return (
        <div className={wargaStyles.iklanCard}>
            <h4>{iklan.judul}</h4>
            <p>{iklan.deskripsi}</p>
            {iklan.images && iklan.images.map((url, idx) => (
                <img key={idx} src={url} alt={`Iklan ${idx + 1}`} className={wargaStyles.iklanImage} />
            ))}
            <small>Diposting oleh: {iklan.creatorName}</small>
            {canEdit && (
                <div className={wargaStyles.iklanActions}>
                    <button className={wargaStyles.actionButton} onClick={() => onEdit(iklan)}><FaEdit /> Edit</button>
                    <button className={wargaStyles.actionButton} onClick={() => onDelete(iklan.id)}><FaTrash /> Hapus</button>
                </div>
            )}
        </div>
    );
}

function WargaDashboard() {
    const { user, userData } = useAuth();
    const [iklanCollection, loadingIklan, errorIklan] = useCollection(collection(db, 'iklan'));
    const [pengumumanCollection, loadingPengumuman, errorPengumuman] = useCollection(collection(db, 'pengumuman'));

    const [showForm, setShowForm] = useState(false);
    const [formState, setFormState] = useState<IklanFormState>({ id: null, judul: '', deskripsi: '' });
    const [files, setFiles] = useState<FileList | null>(null);
    const [selectedPengumuman, setSelectedPengumuman] = useState<Pengumuman | null>(null);

    // 3. Apply types to handlers
    const handleFormSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!user || !userData) return;


        // Cek jika user sudah punya iklan aktif (belum expired)
        if (!formState.id) {
            const now = new Date();
            const activeIklanQuery = query(
                collection(db, 'iklan'),
                where('creatorEmail', '==', user.email?.toLowerCase())
            );
            const activeIklanSnapshot = await getDocs(activeIklanQuery);
            const hasActiveIklan = activeIklanSnapshot.docs.some(doc => {
                const data = doc.data();
                return data.expiredAt && data.expiredAt.toDate() > now;
            });
            if (hasActiveIklan) {
                alert('Anda sudah memiliki iklan aktif. Tunggu hingga iklan sebelumnya expired (7 hari) untuk posting iklan baru.');
                return;
            }
        }

        // --- Tambahan: handle upload images ---
        let imageUrls: string[] = [];
        if (files && files.length > 0) {
            const uploadPromises = Array.from(files).slice(0, 3).map(async (file) => {
                // Compress
                const options = {
                    maxSizeMB: 0.5,
                    maxWidthOrHeight: 1280,
                    useWebWorker: true,
                    fileType: 'image/webp'
                };
                const compressedFile = await imageCompression(file, options);

                const storageRef = ref(storage, `iklan/${user.uid}/${Date.now()}_${file.name.split('.')[0]}.webp`);
                await uploadBytes(storageRef, compressedFile);
                return getDownloadURL(storageRef);
            });
            imageUrls = await Promise.all(uploadPromises);
        }
        // --- End tambahan ---

        if (formState.id) {
            await updateDoc(doc(db, 'iklan', formState.id), {
                judul: formState.judul,
                deskripsi: formState.deskripsi,
            });
        } else {
            await addDoc(collection(db, 'iklan'), {
                judul: formState.judul,
                deskripsi: formState.deskripsi,
                creatorEmail: user.email?.toLowerCase(),
                creatorName: userData.nama || 'Warga',
                createdAt: new Date(),
                expiredAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 hari
                images: imageUrls,
            });
        }
        setFormState({ id: null, judul: '', deskripsi: '' });
        setFiles(null);
        setShowForm(false);
    };

    const handleEdit = (iklan: Iklan) => {
        setFormState({ id: iklan.id, judul: iklan.judul, deskripsi: iklan.deskripsi });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Anda yakin ingin menghapus iklan ini?')) {
            await deleteDoc(doc(db, 'iklan', id));
        }
    };

    // Sort client side to bypass potential index issues
    const iklanData = (iklanCollection?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Iklan)) || [])
        .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    const pengumumanData = (pengumumanCollection?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pengumuman)) || [])
        .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    console.log('[WargaDashboard] Loading iklan:', loadingIklan, 'count:', iklanData.length, 'error:', errorIklan?.message);
    console.log('[WargaDashboard] Loading pengumuman:', loadingPengumuman, 'count:', pengumumanData.length, 'error:', errorPengumuman?.message);

    return (
        <div className={wargaStyles.container}>
            <Head><title>Dashboard Warga - WargaKoba</title></Head>

            {/* Pengumuman Section */}
            <div className={wargaStyles.section}>
                <h3><FaBullhorn /> Pengumuman Terbaru</h3>
                <div className={wargaStyles.announcementGrid}>
                    {errorPengumuman && <p className={wargaStyles.errorText}>Error: {errorPengumuman.message}</p>}
                    {loadingPengumuman ? (
                        <p>Memuat pengumuman...</p>
                    ) : pengumumanData.length > 0 ? (
                        pengumumanData.map(p => (
                            <div key={p.id} className={wargaStyles.announcementCard} onClick={() => setSelectedPengumuman(p)}>
                                <div className={wargaStyles.thumbnailWrapper}>
                                    {p.images && p.images.length > 0 ? (
                                        <img src={p.images[0]} alt={p.judul} className={wargaStyles.thumbnail} />
                                    ) : (
                                        <div className={wargaStyles.placeholderThumbnail}><FaImage /></div>
                                    )}
                                </div>
                                <div className={wargaStyles.content}>
                                    <h4>{p.judul}</h4>
                                    <p className={wargaStyles.excerpt}>{p.isi}</p>
                                    <div className={wargaStyles.meta}>
                                        <span>{p.penulis}</span>
                                        <span>{p.createdAt?.toDate().toLocaleDateString('id-ID')}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>Belum ada pengumuman.</p>
                    )}
                </div>
            </div>

            {/* Iklan Section */}
            <div className={wargaStyles.section}>
                <h3><FaPlus /> Iklan Komunitas</h3>
                <button className={wargaStyles.primaryButton} onClick={() => { setFormState({ id: null, judul: '', deskripsi: '' }); setShowForm(!showForm); }}>
                    {showForm ? 'Tutup Form' : 'Tambah Iklan Baru'}
                </button>
                {showForm && (
                    <form onSubmit={handleFormSubmit} className={wargaStyles.form}>
                        <input type="text" placeholder="Judul Iklan" value={formState.judul} onChange={(e) => setFormState({ ...formState, judul: e.target.value })} required />
                        <textarea placeholder="Deskripsi Iklan" value={formState.deskripsi} onChange={(e) => setFormState({ ...formState, deskripsi: e.target.value })} required></textarea>
                        <input type="file" multiple accept="image/*" onChange={(e) => setFiles(e.target.files)} />
                        <small>Maksimal 3 foto (opsional)</small>
                        <button type="submit" className={wargaStyles.primaryButton}>{formState.id ? 'Update Iklan' : 'Posting Iklan'}</button>
                    </form>
                )}
                <div className={wargaStyles.iklanGrid}>
                    {loadingIklan ? <p>Memuat...</p> : iklanData.map(iklan => (
                        <IklanCard key={iklan.id} iklan={iklan} onEdit={handleEdit} onDelete={handleDelete} />
                    ))}
                </div>
            </div>

            {/* Modal Detail Pengumuman */}
            {selectedPengumuman && (
                <div className={wargaStyles.modalOverlay} onClick={() => setSelectedPengumuman(null)}>
                    <div className={wargaStyles.modalContent} onClick={e => e.stopPropagation()}>
                        <button className={wargaStyles.modalClose} onClick={() => setSelectedPengumuman(null)}><FaTimes /></button>
                        <div className={wargaStyles.modalHeader}>
                            <span className={wargaStyles.badge}>Pengumuman</span>
                            <h2>{selectedPengumuman.judul}</h2>
                        </div>
                        <div className={wargaStyles.modalBody}>
                            <p>{selectedPengumuman.isi}</p>
                            {selectedPengumuman.images && selectedPengumuman.images.length > 0 && (
                                <div className={wargaStyles.modalImages}>
                                    {selectedPengumuman.images.map((img, idx) => (
                                        <img key={idx} src={img} alt={`${selectedPengumuman.judul} ${idx + 1}`} />
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className={wargaStyles.modalFooter}>
                            <p>Oleh: {selectedPengumuman.penulis} | {selectedPengumuman.createdAt?.toDate().toLocaleString('id-ID')}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Dashboard() {
    const { user, userData, loading } = useAuth();
    const router = useRouter();

    if (loading) {
        return <Layout><div>Memuat...</div></Layout>;
    }

    if (userData?.role === 'admin') {
        return (
            <Layout>
                <Head><title>Dashboard Admin - WargaKoba</title></Head>
                <div className={styles.container}>
                    <header className={styles.header}>
                        <h1>Selamat Datang, Admin</h1>
                        <p className={styles.userEmail}>{userData?.nama || user?.email}</p>
                    </header>
                    <AdminDashboard />
                </div>
            </Layout>
        );
    }

    if (userData?.role === 'warga') {
        return (
            <Layout>
                <WargaDashboard />
            </Layout>
        );
    }

    return (
        <Layout>
            <Head><title>Dashboard Satpam - WargaKoba</title></Head>
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1>Selamat Datang, Satpam</h1>
                    <p className={styles.userEmail}>{userData?.nama || user?.email}</p>
                </header>
                <div className={styles.grid}>
                    <Link href="/laporan-patroli" className={styles.actionCard}>
                        <FaUserCheck className={styles.actionCardIcon} />
                        <h3>Laporan Patroli</h3>
                        <p>Lihat dan kelola laporan patroli keamanan untuk menjaga lingkungan.</p>
                    </Link>
                </div>
            </div>
        </Layout>
    );
}

// 4. FIX: Corrected the withAuth call
export default withAuth(Dashboard);
