import { useState, useMemo, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, Timestamp, Query, limit, startAfter, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/hooks';
import Layout from '../components/Layout';
import { withAuth } from '../components/withAuth';
import styles from '../styles/DataWarga.module.css';
// ... imports remain the same, ensure to import necessary icons if missing
// Added FaCalendarAlt, FaBriefcase, FaVenusMars, FaHandHoldingHeart to existing imports or new ones
import { FaEdit, FaTrash, FaSave, FaTimes, FaPlus, FaSearch, FaUser, FaIdCard, FaVenusMars, FaBirthdayCake, FaUserFriends, FaBriefcase, FaHandHoldingHeart, FaMapMarkedAlt, FaUsers, FaChevronDown, FaSpinner } from 'react-icons/fa';

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

const formatToInputDate = (timestamp: Timestamp) => {
  if (!timestamp) return '';
  try {
    return timestamp.toDate().toISOString().split('T')[0];
  } catch (e) { return ''; }
}

function DataWarga() {
  const { userData, loading: authLoading } = useAuth();
  const router = useRouter();
  // Using simple boolean or check editData for modal visibility
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState<Partial<Warga> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  /* 
    Refactored Logic: Grouping by KK with Lazy Loading 
  */
  const [kkList, setKkList] = useState<Warga[]>([]); // List of 'Kepala Keluarga'
  const [lastDoc, setLastDoc] = useState<any>(null); // Cursor for pagination
  const [loadingKK, setLoadingKK] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Map to store family members: { "NoKK": [Member1, Member2] }
  const [familyMembers, setFamilyMembers] = useState<{ [key: string]: Warga[] }>({});
  const [expandedKK, setExpandedKK] = useState<string | null>(null);
  const [loadingMembers, setLoadingMembers] = useState<{ [key: string]: boolean }>({});

  // Initial Load (Kepala Keluarga only)
  useEffect(() => {
    if (!userData || authLoading) return;

    // Reset state on role change or initial load
    setKkList([]);
    setLastDoc(null);
    setHasMore(true);
    fetchKK(true);
  }, [userData, authLoading]);

  const fetchKK = async (isInitial = false) => {
    if (!userData) return;
    setLoadingKK(true);
    try {
      let q;
      const wargaRef = collection(db, 'warga');

      if (userData.role === 'warga') {
        // Warga only sees their own family. No pagination needed really, but kept for consistency.
        // Actually, for 'warga' role, we just fetch their own KK.
        q = query(wargaRef, where("noKK", "==", userData.noKK), where("statusHubungan", "==", "Kepala Keluarga"));
      } else if (userData.role === 'admin') {
        // Admin sees all KKs
        // Note: 'orderBy' is required for 'limit' and cursor. 
        // Ideally index on statusHubungan + nama
        // For now we assume simple index exists or just filter client side if small? 
        // No, must be server query.
        // Ensure "statusHubungan" == "Kepala Keluarga"
        let constraints: any[] = [
          where("statusHubungan", "==", "Kepala Keluarga"),
          orderBy("nama"), // Alphabetical order
          limit(10)
        ];

        if (!isInitial && lastDoc) {
          constraints.push(startAfter(lastDoc));
        }

        q = query(wargaRef, ...constraints);
      } else {
        // Role lain tidak diizinkan mengakses data warga.
        return;
      }

      const snapshot = await getDocs(q);
      const newKKs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Warga));

      if (snapshot.docs.length < 10) {
        setHasMore(false);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);

      if (isInitial) {
        setKkList(newKKs);
      } else {
        setKkList(prev => [...prev, ...newKKs]);
      }

    } catch (err: any) {
      console.error("Error fetching KK:", err);
      // alert("Gagal memuat data KK: " + err.message);
    } finally {
      setLoadingKK(false);
    }
  };

  const toggleExpand = async (kk: Warga) => {
    if (expandedKK === kk.noKK) {
      setExpandedKK(null); // Collapse
      return;
    }

    setExpandedKK(kk.noKK);

    // Check if members already loaded
    if (familyMembers[kk.noKK]) return;

    // Lazy Load Members
    setLoadingMembers(prev => ({ ...prev, [kk.noKK]: true }));
    try {
      const q = query(collection(db, 'warga'), where("noKK", "==", kk.noKK));
      const snap = await getDocs(q);
      const members = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Warga));

      // Sort: KK first (redundant if checking parent), then Wife, Children
      const order: { [key: string]: number } = { "Kepala Keluarga": 1, "Istri": 2, "Anak": 3, "Lainnya": 4 };
      members.sort((a, b) => (order[a.statusHubungan] || 99) - (order[b.statusHubungan] || 99));

      setFamilyMembers(prev => ({ ...prev, [kk.noKK]: members }));
    } catch (err) {
      console.error("Error fetching members:", err);
    } finally {
      setLoadingMembers(prev => ({ ...prev, [kk.noKK]: false }));
    }
  };

  // Re-use logic for search?
  // Limitation: Search only filters loaded KKs or we use server side text search (not possible easily in Firestore free).
  // For this optimized version, we will filter *only loaded KKs by name*.
  const filteredKKList = kkList.filter(kk =>
    kk.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    kk.noKK.includes(searchTerm)
  );

  const pageTitle = userData?.role === 'warga' ? `Data Keluarga Saya` : 'Data Seluruh Warga';
  const isWarga = userData?.role === 'warga';

  // --- Handlers restored ---
  const handleEdit = (w: Warga) => {
    setEditData({
      ...w,
      tanggalLahirStr: formatToInputDate(w.tanggalLahir)
    } as any);
    setIsEditModalOpen(true);
  };

  const handleCancel = () => {
    setIsEditModalOpen(false);
    setEditData(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editData || !editData.id) return;
    try {
      const dataToUpdate = { ...editData };
      if ((dataToUpdate as any).tanggalLahirStr) {
        dataToUpdate.tanggalLahir = Timestamp.fromDate(new Date((dataToUpdate as any).tanggalLahirStr));
        delete (dataToUpdate as any).tanggalLahirStr;
      }
      const docRef = doc(db, 'warga', editData.id);
      await updateDoc(docRef, dataToUpdate);
      handleCancel();
      // Refresh data logic? With local state, likely need to update locally or re-fetch.
      // For now, simpler to reload or let user reload, or ideally update local state.
      // Updating local state for immediate feedback:
      setKkList(prev => prev.map(k => k.id === editData.id ? { ...k, ...dataToUpdate } as Warga : k));
      // Also update members if separate
      if (editData.noKK) {
        setFamilyMembers(prev => ({
          ...prev,
          [editData.noKK as string]: prev[editData.noKK as string]?.map(m => m.id === editData.id ? { ...m, ...dataToUpdate } as Warga : m) || []
        }));
      }

    } catch (error) {
      console.error("Error updating document: ", error);
      alert("Gagal mengupdate data.");
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
        // Update local state
        // Find KK
        // Since we don't know KK easily here without passing it, might need to re-fetch or pass parent KK.
        // Assuming we can just find it in familyMembers.
        // For simplicity, we just iterate familyMembers to remove.
        const newFamMembers = { ...familyMembers };
        Object.keys(newFamMembers).forEach(k => {
          newFamMembers[k] = newFamMembers[k].filter(m => m.id !== id);
        });
        setFamilyMembers(newFamMembers);
      } catch (error) {
        console.error("Error deleting document: ", error);
      }
    }
  };
  // -------------------------

  return (
    <Layout>
      <Head><title>Data Warga - WargaKoba</title></Head>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>{pageTitle}</h1>
          <div className={styles.controls}>
            {/* Search input remains same */}
            <div className={styles.searchContainer}>
              <FaSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Cari Kepala Keluarga / No. KK..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            {/* Add Buttons remain same */}
            {userData?.role === 'admin' && (
              <button className={styles.addButton} onClick={() => router.push('/tambah-warga')}>
                <FaPlus /> Tambah Data
              </button>
            )}
          </div>
        </header>

        {/* KK LIST (Grouped) */}
        <div className={styles.kkListContainer}>
          {filteredKKList.map((kk) => (
            <div key={kk.id} className={`${styles.kkCard} ${expandedKK === kk.noKK ? styles.expanded : ''}`}>
              <div className={styles.kkHeader} onClick={() => toggleExpand(kk)}>
                <div className={styles.kkInfo}>
                  <h3>{kk.nama}</h3>
                  <p><FaIdCard /> {kk.noKK} &bull; {kk.alamatBlok ? `Blok ${kk.alamatBlok} No. ${kk.nomorRumah}` : 'Alamat belum lengkap'}</p>
                </div>
                <button className={styles.expandBtn}>
                  <FaChevronDown />
                </button>
              </div>

              {expandedKK === kk.noKK && (
                <div className={styles.membersList}>
                  {loadingMembers[kk.noKK] ? (
                    <div className={styles.skeletonMember}>Memuat anggota keluarga...</div>
                  ) : (
                    <div className={styles.membersTableContainer}>
                      <table className={styles.membersTable}>
                        <thead>
                          <tr>
                            <th>Nama</th>
                            <th>NIK</th>
                            <th>Hubungan</th>
                            <th>L/P</th>
                            <th>Pekerjaan</th>
                            <th>Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {familyMembers[kk.noKK]?.map(member => (
                            <tr key={member.id}>
                              <td>{member.nama}</td>
                              <td>{member.nik}</td>
                              <td>
                                <span className={`${styles.badge} ${member.statusHubungan === 'Kepala Keluarga' ? styles.badgeMale : styles.badgeFemale}`}>
                                  {member.statusHubungan}
                                </span>
                              </td>
                              <td>{member.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}</td>
                              <td>{member.pekerjaan || '-'}</td>
                              <td>
                                <div className={styles.buttonGroup}>
                                  {(userData?.role === 'admin' || userData?.role === 'warga') && (
                                    <button onClick={(e) => { e.stopPropagation(); handleEdit(member); }} className={`${styles.actionButton} ${styles.editButton}`}><FaEdit /></button>
                                  )}
                                  {(userData?.role === 'admin' || (userData?.role === 'warga' && member.statusHubungan !== 'Kepala Keluarga')) && (
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(member.id, member.statusHubungan); }} className={`${styles.actionButton} ${styles.deleteButton}`}><FaTrash /></button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {loadingKK && <div className={styles.loading}>Memuat data KK...</div>}

          {!loadingKK && filteredKKList.length === 0 && (
            <div className={styles.noResults}>Tidak ada data kepala keluarga yang ditemukan.</div>
          )}

          {/* Load More Button */}
          {!isWarga && hasMore && !searchTerm && (
            <div className={styles.loadMoreContainer}>
              <button className={styles.loadMoreBtn} onClick={() => fetchKK(false)} disabled={loadingKK}>
                {loadingKK ? <FaSpinner className={styles.spin} /> : 'Muat Lebih Banyak'}
              </button>
            </div>
          )}
        </div>

        {/* EDIT MODAL REMAINS THE SAME... */}

        {/* Edit Modal */}
        {isEditModalOpen && editData && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2>Edit Data Warga</h2>
                <button onClick={handleCancel} className={styles.closeModalBtn}><FaTimes /></button>
              </div>
              <form onSubmit={handleUpdate} className={styles.modalForm}>
                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label>Nama Lengkap</label>
                    <div className={styles.inputWrapper}>
                      <FaUser />
                      <input value={editData.nama} onChange={e => setEditData({ ...editData, nama: e.target.value })} required />
                    </div>
                  </div>
                  <div className={styles.inputGroup}>
                    <label>NIK</label>
                    <div className={styles.inputWrapper}>
                      <FaIdCard />
                      <input value={editData.nik} onChange={e => setEditData({ ...editData, nik: e.target.value })} required />
                    </div>
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Jenis Kelamin</label>
                    <div className={styles.inputWrapper}>
                      <FaVenusMars />
                      <select value={editData.jenisKelamin} onChange={e => setEditData({ ...editData, jenisKelamin: e.target.value })}>
                        <option>Laki-laki</option>
                        <option>Perempuan</option>
                      </select>
                    </div>
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Tanggal Lahir</label>
                    <div className={styles.inputWrapper}>
                      <FaBirthdayCake />
                      <input type="date" value={(editData as any).tanggalLahirStr || ''} onChange={e => setEditData({ ...editData, tanggalLahirStr: e.target.value } as any)} required />
                    </div>
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Hubungan</label>
                    <div className={styles.inputWrapper}>
                      <FaUserFriends />
                      <select value={editData.statusHubungan} onChange={e => setEditData({ ...editData, statusHubungan: e.target.value })}>
                        <option>Kepala Keluarga</option>
                        <option>Istri</option>
                        <option>Anak</option>
                        <option>Lainnya</option>
                      </select>
                    </div>
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Pekerjaan</label>
                    <div className={styles.inputWrapper}>
                      <FaBriefcase />
                      <input value={editData.pekerjaan || ''} onChange={e => setEditData({ ...editData, pekerjaan: e.target.value })} />
                    </div>
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Status Perkawinan</label>
                    <div className={styles.inputWrapper}>
                      <FaHandHoldingHeart />
                      <select value={editData.statusPerkawinan || 'Belum Kawin'} onChange={e => setEditData({ ...editData, statusPerkawinan: e.target.value })}>
                        <option>Belum Kawin</option>
                        <option>Kawin</option>
                        <option>Cerai Hidup</option>
                        <option>Cerai Mati</option>
                      </select>
                    </div>
                  </div>
                  {/* Admin specific edits */}
                  {!isWarga && (
                    <>
                      <div className={styles.inputGroup}>
                        <label>No. KK</label>
                        <div className={styles.inputWrapper}>
                          <FaUsers />
                          <input value={editData.noKK} onChange={e => setEditData({ ...editData, noKK: e.target.value })} required />
                        </div>
                      </div>
                      <div className={styles.inputGroup}>
                        <label>Alamat Blok</label>
                        <div className={styles.inputWrapper}>
                          <FaMapMarkedAlt />
                          <input value={editData.alamatBlok || ''} onChange={e => setEditData({ ...editData, alamatBlok: e.target.value })} />
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className={styles.modalFooter}>
                  <button type="button" onClick={handleCancel} className={styles.cancelBtn}>Batal</button>
                  <button type="submit" className={styles.saveBtn}>Simpan Perubahan</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default withAuth(DataWarga, ['admin', 'warga']); // Satpam tidak boleh akses data warga
