
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { collection, addDoc, onSnapshot, serverTimestamp, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/hooks';
import Layout from '../../components/Layout';
import { withAuth } from '../../components/withAuth';
import styles from '../../styles/Form.module.css';
import { FaPlus, FaTrash, FaEdit, FaSave } from 'react-icons/fa';

interface Pengumuman {
    id: string;
    judul: string;
    isi: string;
    penulis: string;
    createdAt: any;
}

function KelolaPengumuman() {
    const { userData } = useAuth();
    const [pengumuman, setPengumuman] = useState<Pengumuman[]>([]);
    const [judul, setJudul] = useState('');
    const [isi, setIsi] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const q = query(collection(db, 'pengumuman'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pengumuman));
            setPengumuman(docs);
        });
        return () => unsubscribe();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!judul || !isi) {
            setError('Judul dan isi pengumuman tidak boleh kosong.');
            return;
        }
        setIsSubmitting(true);
        setError('');

        try {
            if (editingId) {
                const docRef = doc(db, 'pengumuman', editingId);
                await updateDoc(docRef, {
                    judul,
                    isi,
                });
                setEditingId(null);
            } else {
                await addDoc(collection(db, 'pengumuman'), {
                    judul,
                    isi,
                    penulis: userData?.nama || 'Admin',
                    createdAt: serverTimestamp(),
                });
            }
            setJudul('');
            setIsi('');
        } catch (err) {
            console.error(err);
            setError('Gagal menyimpan pengumuman.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (item: Pengumuman) => {
        setEditingId(item.id);
        setJudul(item.judul);
        setIsi(item.isi);
        window.scrollTo(0, 0); // Scroll to top to the form
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) {
            try {
                await deleteDoc(doc(db, 'pengumuman', id));
            } catch (err) {
                console.error(err);
                alert('Gagal menghapus pengumuman.');
            }
        }
    };

    return (
        <Layout>
            <Head><title>Kelola Pengumuman - WargaKoba</title></Head>
            <div className={styles.container}>
                <div className={styles.formContainer}>
                     <header className={styles.header}>
                        <h1>{editingId ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}</h1>
                     </header>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        {error && <p className={styles.errorBanner}>{error}</p>}
                        <div className={styles.inputGroup}><label htmlFor="judul">Judul</label><input id="judul" type="text" value={judul} onChange={(e) => setJudul(e.target.value)} /></div>
                        <div className={styles.inputGroup}><label htmlFor="isi">Isi Pengumuman</label><textarea id="isi" value={isi} onChange={(e) => setIsi(e.target.value)} rows={5}></textarea></div>
                        <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                            {editingId ? <><FaSave /> Simpan Perubahan</> : <><FaPlus /> Publikasikan</>}
                        </button>
                        {editingId && <button type="button" onClick={() => { setEditingId(null); setJudul(''); setIsi(''); }} className={styles.cancelButton}>Batal</button>}
                    </form>
                </div>

                <div className={styles.listContainer}>
                    <h2>Daftar Pengumuman</h2>
                    <ul className={styles.pengumumanList}>
                        {pengumuman.map(item => (
                            <li key={item.id} className={styles.pengumumanItem}>
                                <h3>{item.judul}</h3>
                                <p>{item.isi}</p>
                                <small>Oleh: {item.penulis} | {item.createdAt?.toDate().toLocaleDateString()}</small>
                                <div className={styles.pengumumanActions}>
                                    <button onClick={() => handleEdit(item)}><FaEdit /> Edit</button>
                                    <button onClick={() => handleDelete(item.id)}><FaTrash /> Hapus</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </Layout>
    );
}

// FIX: Removed the second argument from withAuth call
export default withAuth(KelolaPengumuman);
