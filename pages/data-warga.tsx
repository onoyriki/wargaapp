
import { useState, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, Timestamp, Query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/hooks';
import Layout from '../components/Layout';
import { withAuth } from '../components/withAuth';
import styles from '../styles/DataWarga.module.css';
import { FaEdit, FaTrash, FaSave, FaTimes, FaPlus, FaSearch } from 'react-icons/fa';


type Warga = {
  id: string;
  nama: string;
  nik: string;
  noKK: string;
  jenisKelamin: string;
  tanggalLahir: Timestamp;
  alamatBlok: string;
  nomorRumah: string;
  statusHubungan: string;
  statusKepemilikan?: string;
  pekerjaan: string;
  statusPerkawinan: string;
};

const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return 'N/A';
    return timestamp.toDate().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

const formatToInputDate = (timestamp: Timestamp) => {
    if (!timestamp) return '';
    return timestamp.toDate().toISOString().split('T')[0];
}

function DataWarga() {
  const { userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [editMode, setEditMode] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Warga> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // SAFEGUARD: Build the query only when auth state is confirmed.
  const wargaQuery = useMemo(() => {
    if (authLoading || !userData) {
      // Return null or undefined if auth data is not ready, preventing any data fetch.
      return null;
    }

    const wargaCollectionRef = collection(db, 'warga');

    if (userData.role === 'warga' && userData.noKK) {
      // If user is 'warga', strictly filter by their noKK.
      return query(wargaCollectionRef, where("noKK", "==", userData.noKK));
    } else if (userData.role === 'admin' || userData.role === 'satpam') {
      // If user is admin/satpam, fetch all data.
      return wargaCollectionRef;
    }
    
    // For any other case, do not fetch data.
    return null;
  }, [userData, authLoading]);

  // The hook will not run if the query is null.
  const [wargaCollection, loading, error] = useCollection(wargaQuery);

  const warga: Warga[] = wargaCollection ? wargaCollection.docs.map(doc => ({ id: doc.id, ...doc.data() } as Warga)).sort((a, b) => {
      const order: { [key: string]: number } = { "Kepala Keluarga": 1, "Istri": 2, "Anak": 3, "Lainnya": 4 };
      return (order[a.statusHubungan] || 99) - (order[b.statusHubungan] || 99);
  }) : [];

  const handleEdit = (w: Warga) => {
    setEditMode(w.id);
    setEditData(w);
  };

  const handleCancel = () => {
    setEditMode(null);
    setEditData(null);
  };

  const handleUpdate = async (id: string) => {
    if (!editData) return;
    try {
      // Check if NIK is unique if changed
      if (editData.nik) {
        const nikQuery = query(collection(db, 'warga'), where('nik', '==', editData.nik));
        const nikSnapshot = await getDocs(nikQuery);
        const existingDocs = nikSnapshot.docs.filter(doc => doc.id !== id);
        if (existingDocs.length > 0) {
          alert('NIK sudah terdaftar. Harap gunakan NIK yang berbeda.');
          return;
        }
      }

      const docRef = doc(db, 'warga', id);
      await updateDoc(docRef, editData);
      handleCancel(); 
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  const handleDelete = async (id: string, statusHubungan: string) => {
    if (statusHubungan === 'Kepala Keluarga') {
        alert('Tidak dapat menghapus Kepala Keluarga. Ubah status hubungan terlebih dahulu atau hapus dari database langsung.');
        return;
    }
    if (window.confirm('Apakah Anda yakin ingin menghapus data anggota ini?')) {
        try {
            await deleteDoc(doc(db, 'warga', id));
        } catch (error) {
            console.error("Error deleting document: ", error);
        }
    }
  };

  const filteredWarga = warga.filter(w => 
    w.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.nik.includes(searchTerm) ||
    (w.noKK && w.noKK.includes(searchTerm)) ||
    (userData?.role !== 'warga' && w.alamatBlok.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const pageTitle = userData?.role === 'warga' ? `Data Keluarga (KK: ${userData?.noKK})` : 'Data Seluruh Warga';
  const isWarga = userData?.role === 'warga';

  return (
    <Layout>
      <Head><title>Data Warga - WargaKoba</title></Head>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>{pageTitle}</h1>
          <div className={styles.controls}>
             <div className={styles.searchContainer}>
                <FaSearch className={styles.searchIcon} />
                <input 
                    type="text"
                    placeholder={isWarga ? "Cari nama atau NIK..." : "Cari nama, NIK, No. KK..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                />
            </div>
            {/* Only admins can add data */}
            {userData?.role === 'admin' && (
              <button className={styles.addButton} onClick={() => router.push('/tambah-warga')}>
                  <FaPlus /> Tambah Data
              </button>
            )}
            {/* Warga can add family members */}
            {userData?.role === 'warga' && userData?.noKK && (
              <button className={styles.addButton} onClick={() => router.push('/tambah-warga')}>
                  <FaPlus /> Tambah Anggota Keluarga
              </button>
            )}
          </div>
        </header>

        {(loading || authLoading) && <div className={styles.loading}>Memuat data...</div>}
        {error && <div className={styles.error}>Error: {error.message}</div>}

        {!loading && !authLoading && !error && (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nama</th>
                  {!isWarga && <th>No. KK</th>}
                  <th>NIK</th>
                  <th>Hubungan</th>
                  {!isWarga && <th>Alamat</th>} 
                  {!isWarga && <th>Status Rumah</th>}
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredWarga.map((w) => (
                  <tr key={w.id}>
                    {editMode === w.id && (userData?.role === 'admin' || userData?.role === 'warga') ? (
                      <>
                        <td data-label="Nama"><input type="text" value={editData?.nama || ''} onChange={(e) => setEditData({...editData, nama: e.target.value})} className={styles.editInput} /></td>
                        {!isWarga && <td data-label="No. KK"><input type="text" value={editData?.noKK || ''} onChange={(e) => setEditData({...editData, noKK: e.target.value})} className={styles.editInput} /></td>}
                        <td data-label="NIK"><input type="text" value={editData?.nik || ''} onChange={(e) => setEditData({...editData, nik: e.target.value})} className={styles.editInput} /></td>
                        <td data-label="Hubungan"><select value={editData?.statusHubungan || ''} onChange={(e) => setEditData({...editData, statusHubungan: e.target.value})} className={styles.editSelect}><option>Kepala Keluarga</option><option>Istri</option><option>Anak</option><option>Lainnya</option></select></td>
                        {!isWarga && <td data-label="Alamat">{`${w.alamatBlok} - ${w.nomorRumah}`}</td>}
                        {!isWarga && <td data-label="Status Rumah"><select value={editData?.statusKepemilikan || ''} onChange={(e) => setEditData({...editData, statusKepemilikan: e.target.value})} className={styles.editSelect}><option>Pemilik</option><option>Sewa</option></select></td>}
                        <td data-label="Aksi">
                          <div className={styles.buttonGroup}>
                            <button onClick={() => handleUpdate(w.id)} className={`${styles.actionButton} ${styles.saveButton}`}><FaSave /></button>
                            <button onClick={handleCancel} className={`${styles.actionButton} ${styles.cancelButton}`}><FaTimes /></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td data-label="Nama">{w.nama}</td>
                        {!isWarga && <td data-label="No. KK">{w.noKK}</td>}
                        <td data-label="NIK">{w.nik}</td>
                        <td data-label="Hubungan">{w.statusHubungan}</td>
                        {!isWarga && <td data-label="Alamat">{`${w.alamatBlok} - ${w.nomorRumah}`}</td>}
                        {!isWarga && <td data-label="Status Rumah">{w.statusKepemilikan}</td>}
                        <td data-label="Aksi">
                          <div className={styles.buttonGroup}>
                            {(userData?.role === 'admin' || userData?.role === 'warga') && <button onClick={() => handleEdit(w)} className={`${styles.actionButton} ${styles.editButton}`}><FaEdit /></button>}
                            {(userData?.role === 'admin' || (userData?.role === 'warga' && w.statusHubungan !== 'Kepala Keluarga')) && <button onClick={() => handleDelete(w.id, w.statusHubungan)} className={`${styles.actionButton} ${styles.deleteButton}`}><FaTrash /></button>}
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredWarga.length === 0 && !loading && <div className={styles.noResults}>Tidak ada data warga yang cocok.</div>}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default withAuth(DataWarga); // No roles needed, logic is handled inside
