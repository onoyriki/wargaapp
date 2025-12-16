
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { withAuth } from '../../components/withAuth';
import Layout from '../../components/Layout';
import { FaPlus, FaTrash, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import styles from '../../styles/KelolaPatroli.module.css';

// Type definition for Checkpoint
type Checkpoint = {
  id: string;
  nama: string;
  deskripsi: string;
  urutan: number;
  aktif: boolean;
};

const KelolaPatroli = () => {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form State
  const [nama, setNama] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editNama, setEditNama] = useState('');
  const [editDeskripsi, setEditDeskripsi] = useState('');

  const fetchCheckpoints = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'patrol_checkpoints'), orderBy('urutan', 'asc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Checkpoint));
      setCheckpoints(data);
    } catch (err: any) {
      console.error(err);
      setError('Gagal memuat data titik patroli.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckpoints();
  }, []);

  const handleAddCheckpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama) return;

    try {
      const newOrder = checkpoints.length > 0 ? Math.max(...checkpoints.map(c => c.urutan)) + 1 : 1;
      
      await addDoc(collection(db, 'patrol_checkpoints'), {
        nama,
        deskripsi,
        urutan: newOrder,
        aktif: true,
        createdAt: serverTimestamp()
      });

      setNama('');
      setDeskripsi('');
      fetchCheckpoints();
    } catch (err: any) {
      console.error(err);
      alert('Gagal menambah titik patroli');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus titik patroli ini?')) return;
    try {
      await deleteDoc(doc(db, 'patrol_checkpoints', id));
      fetchCheckpoints();
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus');
    }
  };

  const startEdit = (cp: Checkpoint) => {
    setIsEditing(cp.id);
    setEditNama(cp.nama);
    setEditDeskripsi(cp.deskripsi);
  };

  const cancelEdit = () => {
    setIsEditing(null);
    setEditNama('');
    setEditDeskripsi('');
  };

  const saveEdit = async (id: string) => {
    try {
      const docRef = doc(db, 'patrol_checkpoints', id);
      await updateDoc(docRef, {
        nama: editNama,
        deskripsi: editDeskripsi
      });
      setIsEditing(null);
      fetchCheckpoints();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan perubahan');
    }
  };

  const toggleStatus = async (cp: Checkpoint) => {
    try {
      const docRef = doc(db, 'patrol_checkpoints', cp.id);
      await updateDoc(docRef, {
        aktif: !cp.aktif
      });
      fetchCheckpoints(); // Or optimistic update
    } catch (err) {
      console.error(err);
      alert('Gagal mengubah status');
    }
  };

  return (
    <Layout>
      <Head><title>Kelola Titik Patroli - Admin</title></Head>
      <div className="container">
        <header style={{ marginBottom: '2rem' }}>
          <h1>Manajemen Titik Patroli</h1>
          <p>Kelola lokasi yang harus diperiksa oleh satpam saat patroli.</p>
        </header>

        {/* Add Checkpoint Form */}
        <div className={styles.card}>
            <h3>Tambah Titik Baru</h3>
            <form onSubmit={handleAddCheckpoint} className={styles.form}>
                <div className={styles.formGroup}>
                    <label>Nama Lokasi</label>
                    <input 
                        type="text" 
                        value={nama} 
                        onChange={(e) => setNama(e.target.value)} 
                        placeholder="Contoh: Gerbang Depan"
                        required 
                    />
                </div>
                <div className={styles.formGroup}>
                    <label>Deskripsi (Opsional)</label>
                    <input 
                        type="text" 
                        value={deskripsi} 
                        onChange={(e) => setDeskripsi(e.target.value)} 
                        placeholder="Keterangan tambahan..."
                    />
                </div>
                <button type="submit" className={styles.addButton}>
                    <FaPlus /> Tambah
                </button>
            </form>
        </div>

        {/* List of Checkpoints */}
        <div style={{ marginTop: '2rem' }}>
            {loading ? <p>Memuat...</p> : (
                <div className={styles.listContainer}>
                    {checkpoints.length === 0 ? <p>Belum ada titik patroli.</p> : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Urutan</th>
                                    <th>Nama Lokasi</th>
                                    <th>Deskripsi</th>
                                    <th>Status</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {checkpoints.map((cp) => (
                                    <tr key={cp.id}>
                                        <td>{cp.urutan}</td>
                                        <td>
                                            {isEditing === cp.id ? (
                                                <input value={editNama} onChange={e => setEditNama(e.target.value)} />
                                            ) : cp.nama}
                                        </td>
                                        <td>
                                            {isEditing === cp.id ? (
                                                <input value={editDeskripsi} onChange={e => setEditDeskripsi(e.target.value)} />
                                            ) : cp.deskripsi}
                                        </td>
                                        <td>
                                            <button 
                                                onClick={() => toggleStatus(cp)}
                                                className={cp.aktif ? styles.statusActive : styles.statusInactive}
                                            >
                                                {cp.aktif ? 'Aktif' : 'Non-Aktif'}
                                            </button>
                                        </td>
                                        <td>
                                            {isEditing === cp.id ? (
                                                <div className={styles.actionGroup}>
                                                    <button onClick={() => saveEdit(cp.id)} className={styles.saveBtn}><FaSave /></button>
                                                    <button onClick={cancelEdit} className={styles.cancelBtn}><FaTimes /></button>
                                                </div>
                                            ) : (
                                                <div className={styles.actionGroup}>
                                                    <button onClick={() => startEdit(cp)} className={styles.editBtn}><FaEdit /></button>
                                                    <button onClick={() => handleDelete(cp.id)} className={styles.deleteBtn}><FaTrash /></button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
      </div>
    </Layout>
  );
};

export default withAuth(KelolaPatroli, ['admin']);
