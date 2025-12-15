
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
import { FaUsers, FaTasks, FaUserCheck, FaArrowRight, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { useState, FC, FormEvent } from 'react';

// 1. Define strict types
interface Iklan {
    id: string;
    judul: string;
    deskripsi: string;
    creatorEmail: string;
    creatorName: string;
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
                <img key={idx} src={url} alt={`Iklan ${idx+1}`} className={wargaStyles.iklanImage} />
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
    const [iklanCollection, loadingIklan] = useCollection(query(collection(db, 'iklan'), orderBy('createdAt', 'desc')));
    const [showForm, setShowForm] = useState(false);
    const [formState, setFormState] = useState<IklanFormState>({ id: null, judul: '', deskripsi: '' });
    const [files, setFiles] = useState<FileList | null>(null);

    // 3. Apply types to handlers
    const handleFormSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!user || !userData) return;

        // Cek jika user sudah punya iklan aktif (belum expired)
        if (!formState.id) {
            const now = new Date();
            const activeIklanQuery = query(
                collection(db, 'iklan'),
                where('creatorEmail', '==', user.email)
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

        if (formState.id) {
            await updateDoc(doc(db, 'iklan', formState.id), {
                judul: formState.judul,
                deskripsi: formState.deskripsi,
            });
        } else {
            await addDoc(collection(db, 'iklan'), {
                judul: formState.judul,
                deskripsi: formState.deskripsi,
                creatorEmail: user.email,
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

    const iklanData = iklanCollection?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Iklan)) || [];

    return (
        <div className={wargaStyles.container}>
            <Head><title>Dashboard Warga - WargaKoba</title></Head>
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
        </div>
    );
}

function Dashboard() {
    const { user, userData, loading } = useAuth();
    const router = useRouter();
    const [wargaCollection, loadingWarga] = useCollection(collection(db, 'warga'));

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
                    <div className={styles.statCard}>
                        <FaUsers className={styles.statCardIcon} />
                        <div>
                            <h3>Total Warga Terdaftar</h3>
                            <p>{loadingWarga ? '...' : wargaCollection?.docs.length ?? 0}</p>
                        </div>
                    </div>
                    <Link href="/data-warga" className={styles.actionCard}>
                        <FaTasks className={styles.actionCardIcon} />
                        <h3>Lihat Data Warga</h3>
                        <p>Akses daftar lengkap semua warga yang terdaftar di dalam sistem.</p>
                        <FaArrowRight className={styles.actionCardArrow} />
                    </Link>
                    <Link href="/laporan-patroli" className={styles.actionCard}>
                        <FaUserCheck className={styles.actionCardIcon} />
                        <h3>Laporan Patroli</h3>
                        <p>Lihat dan kelola laporan patroli keamanan untuk menjaga lingkungan.</p>
                        <FaArrowRight className={styles.actionCardArrow} />
                    </Link>
                </div>
            </div>
        </Layout>
    );
}

// 4. FIX: Corrected the withAuth call
export default withAuth(Dashboard);
