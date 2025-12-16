
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { collection, addDoc, onSnapshot, serverTimestamp, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { useAuth } from '../../lib/hooks';
import Layout from '../../components/Layout';
import { withAuth } from '../../components/withAuth';
import styles from '../../styles/Form.module.css';
import { FaPlus, FaTrash, FaEdit, FaSave } from 'react-icons/fa';
import imageCompression from 'browser-image-compression';

interface Iklan {
    id: string;
    judul: string;
    isi: string;
    penulis: string;
    createdAt: any;
    images?: string[];
}

function KelolaIklan() {
    const { userData } = useAuth();
    const [iklan, setIklan] = useState<Iklan[]>([]);
    const [judul, setJudul] = useState('');
    const [isi, setIsi] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [files, setFiles] = useState<FileList | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'iklan'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Iklan));
            setIklan(docs);
        });
        return () => unsubscribe();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form submitted');
        if (!judul || !isi) {
            setError('Judul dan isi iklan tidak boleh kosong.');
            return;
        }
        setIsSubmitting(true);
        setError('');
        console.log('Starting submission process...');

        try {
            if (editingId) {
                try {
                    const docRef = doc(db, 'iklan', editingId);
                    await updateDoc(docRef, {
                        judul,
                        isi,
                    });
                    setEditingId(null);
                } catch (updateError: any) {
                    if (updateError.code === 'not-found') {
                        setError('Iklan tidak ditemukan. Mungkin sudah dihapus.');
                        setEditingId(null);
                        setJudul('');
                        setIsi('');
                        setIsSubmitting(false);
                        return;
                    }
                    throw updateError;
                }
            } else {
                // Upload images
                let imageUrls: string[] = [];
                if (files && files.length > 0) {
                    if (files.length > 3) {
                        setError('Maksimal 3 foto.');
                        setIsSubmitting(false);
                        return;
                    }
                    for (let i = 0; i < files.length; i++) {
                        const file = files[i];
                        // Compress
                        const options = {
                            maxSizeMB: 0.5,
                            maxWidthOrHeight: 1280,
                            useWebWorker: true,
                            fileType: 'image/webp'
                        };
                        const compressedFile = await imageCompression(file, options);

                        // Sanitize filename: remove spaces and special characters
                        const sanitizedName = file.name
                            .split('.')[0]
                            .replace(/\s+/g, '_')  // Replace spaces with underscore
                            .replace(/[^a-zA-Z0-9_-]/g, '');  // Remove special characters

                        const storageRef = ref(storage, `iklan/${Date.now()}_${sanitizedName}.webp`);
                        console.log('Uploading to:', `iklan/${Date.now()}_${sanitizedName}.webp`);
                        await uploadBytes(storageRef, compressedFile);
                        const url = await getDownloadURL(storageRef);
                        console.log('Image uploaded:', url);
                        imageUrls.push(url);
                    }
                }

                console.log('Creating iklan with images:', imageUrls);
                await addDoc(collection(db, 'iklan'), {
                    judul,
                    isi,
                    penulis: userData?.nama || 'Admin',
                    createdAt: serverTimestamp(),
                    images: imageUrls,
                });
            }
            setJudul('');
            setIsi('');
            setFiles(null);
            // Reset file input
            const fileInput = document.getElementById('files') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        } catch (err) {
            console.error('Error saving iklan:', err);
            setError('Gagal menyimpan iklan.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (item: Iklan) => {
        setEditingId(item.id);
        setJudul(item.judul);
        setIsi(item.isi);
        window.scrollTo(0, 0); // Scroll to top to the form
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus iklan ini?')) {
            try {
                await deleteDoc(doc(db, 'iklan', id));
            } catch (err) {
                console.error(err);
                alert('Gagal menghapus iklan.');
            }
        }
    };

    return (
        <Layout>
            <Head><title>Kelola Iklan - WargaKoba</title></Head>
            <div className={styles.container}>
                <div className={styles.formContainer}>
                    <header className={styles.header}>
                        <h1>{editingId ? 'Edit Iklan' : 'Buat Iklan Baru'}</h1>
                    </header>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        {error && <p className={styles.errorBanner}>{error}</p>}
                        {isSubmitting && <p className={styles.infoBanner}>Sedang memproses... {files && files.length > 0 ? 'Mengupload dan mengkompresi gambar...' : 'Menyimpan data...'}</p>}
                        <div className={styles.inputGroup}><label htmlFor="judul">Judul</label><input id="judul" type="text" value={judul} onChange={(e) => setJudul(e.target.value)} disabled={isSubmitting} /></div>
                        <div className={styles.inputGroup}><label htmlFor="isi">Isi Iklan</label><textarea id="isi" value={isi} onChange={(e) => setIsi(e.target.value)} rows={5} disabled={isSubmitting}></textarea></div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="files">Lampirkan Foto (maks 3)</label>
                            <input id="files" type="file" multiple accept="image/*" onChange={(e) => setFiles(e.target.files)} disabled={isSubmitting} />
                            {files && files.length > 0 && (
                                <small style={{ color: '#718096', marginTop: '0.5rem', display: 'block' }}>
                                    {files.length} foto dipilih - akan dikompresi otomatis
                                </small>
                            )}
                        </div>
                        <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>⏳ Memproses...</>
                            ) : (
                                editingId ? <><FaSave /> Simpan Perubahan</> : <><FaPlus /> Publikasikan</>
                            )}
                        </button>
                        {editingId && <button type="button" onClick={() => { setEditingId(null); setJudul(''); setIsi(''); }} className={styles.cancelButton} disabled={isSubmitting}>Batal</button>}
                    </form>
                </div>

                <div className={styles.listContainer}>
                    <h2>Daftar Iklan</h2>
                    <ul className={styles.pengumumanList}>
                        {iklan.map(item => (
                            <li key={item.id} className={styles.pengumumanItem}>
                                <h3>{item.judul}</h3>
                                <p>{item.isi}</p>
                                {item.images && item.images.length > 0 && (
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                                        {item.images.map((img, idx) => (
                                            <img key={idx} src={img} alt={`${item.judul} ${idx + 1}`} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />
                                        ))}
                                    </div>
                                )}
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

export default withAuth(KelolaIklan);
