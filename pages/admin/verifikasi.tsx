
import { useEffect, useState, useMemo } from 'react';
import Head from 'next/head';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, DocumentData } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/hooks';
import { withAuth } from '../../components/withAuth';
import Layout from '../../components/Layout';
import styles from '../../styles/Verifikasi.module.css';
import { FaUserCheck, FaUserEdit, FaUsersSlash, FaUserCog } from 'react-icons/fa';

// Import sub-components
import UserVerification from '../../components/UserVerification';
import RoleManagement from '../../components/RoleManagement';
import ReportKeluargaIncomplete from '../../components/ReportKeluargaIncomplete';
import ReportProfilIncomplete from '../../components/ReportProfilIncomplete';

interface User extends DocumentData {
  id: string;
  email: string;
  role: string;
  verified: boolean;
  noKK?: string;
  alamatBlok?: string;
  nama?: string;
}

interface Warga extends DocumentData {
  id: string;
  nama: string;
  noKK: string;
  statusInFamily: string;
}

type TabView = 'verification' | 'roles' | 'family' | 'profile';

function AdminVerificationPage() {
  const { userData } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [wargaList, setWargaList] = useState<Warga[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabView>('verification');

  useEffect(() => {
    const fetchData = async () => {
      if (userData?.role !== 'admin') {
        setLoading(false);
        setError('Anda tidak memiliki izin untuk mengakses halaman ini.');
        return;
      }
      try {
        const usersCollection = collection(db, 'users');
        const userSnapshot = await getDocs(usersCollection);
        const usersList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));

        const wargaCollection = collection(db, 'warga');
        const wargaSnapshot = await getDocs(wargaCollection);
        const allWarga = wargaSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Warga));
        setWargaList(allWarga);

        const wargaDataMap = new Map();
        allWarga.forEach(warga => {
          if (warga.email) {
            wargaDataMap.set(warga.email, { noKK: warga.noKK, alamatBlok: warga.alamatBlok, nama: (warga as any).nama });
          }
        });

        const combinedUsers = usersList.map(user => {
          if (wargaDataMap.has(user.email)) {
            return { ...user, ...wargaDataMap.get(user.email) };
          }
          return user;
        });

        setUsers(combinedUsers);
      } catch (err) {
        console.error("Gagal mengambil data:", err);
        setError('Gagal memuat data pengguna dan profil.');
      } finally {
        setLoading(false);
      }
    };

    if (userData) {
      fetchData();
    }
  }, [userData]);

  const handleUpdateUser = async (id: string, newRole: string, newVerifiedStatus: boolean, extraData: Partial<User> = {}) => {
    try {
      const userDocRef = doc(db, 'users', id);
      const updateData = { role: newRole, verified: newVerifiedStatus, ...extraData };
      await updateDoc(userDocRef, updateData);
      setUsers(users.map(user => (user.id === id ? { ...user, ...updateData } : user)));
    } catch (error) {
      console.error("Gagal memperbarui pengguna:", error);
      alert('Gagal memperbarui pengguna.');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus pengguna ini? Akun login (Email/Auth) juga akan dihapus secara permanen.')) {
      try {
        // 1. Hapus dari Firestore
        await deleteDoc(doc(db, 'users', id));

        // 2. Hapus dari Firebase Auth via API
        const response = await fetch('/api/delete-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: id })
        });

        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errData = await response.json();
            console.warn('Gagal menghapus akun Auth:', errData.message);
          } else {
            const rawError = await response.text();
            console.error('API Error (Non-JSON):', rawError.substring(0, 100));
          }
          // Kita tetap lanjut karena data Firestore sudah terhapus
        }

        setUsers(users.filter(user => user.id !== id));
        alert('Pengguna berhasil dihapus sepenuhnya.');
      } catch (error) {
        console.error("Gagal menghapus pengguna:", error);
        alert('Gagal menghapus pengguna.');
      }
    }
  };

  const handleAddUser = async (userData: Partial<User>) => {
    try {
      const defaultPassword = 'wargakoba123'; // Password default

      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...userData,
          password: defaultPassword
        })
      });

      const contentType = response.headers.get('content-type');
      let data: any = {};

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const rawText = await response.text();
        console.error('API Error (Non-JSON):', rawText.substring(0, 200));
        throw new Error('API mengembalikan respon tidak valid (HTML). Silakan periksa log server.');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Gagal menambah pengguna');
      }

      const newUser = {
        id: data.uid,
        ...userData,
        verified: false
      } as User;

      setUsers(prev => [...prev, newUser]);
      alert(`Pengguna berhasil ditambahkan!\nPassword Login default: ${defaultPassword}`);
      return true;
    } catch (error: any) {
      console.error("Gagal menambah pengguna:", error);
      alert('Gagal menambah pengguna: ' + error.message);
      return false;
    }
  };

  const incompleteProfiles = useMemo(() => {
    return users.filter(user => user.role === 'warga' && (!user.noKK || !user.alamatBlok));
  }, [users]);

  const incompleteFamilies = useMemo(() => {
    if (wargaList.length === 0) return [];
    const kkMemberCount = wargaList.reduce((acc, warga) => {
      if (warga.noKK) {
        acc[warga.noKK] = (acc[warga.noKK] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const singleMemberKKs = Object.keys(kkMemberCount).filter(noKK => kkMemberCount[noKK] === 1);
    return wargaList.filter(warga => warga.noKK && singleMemberKKs.includes(warga.noKK));
  }, [wargaList]);

  if (loading) {
    return <Layout><div className={styles.loadingContainer}>Memuat data...</div></Layout>;
  }

  if (userData?.role !== 'admin') {
    return <Layout><p className={styles.error}>Akses Ditolak. Anda harus menjadi admin untuk melihat halaman ini.</p></Layout>;
  }

  return (
    <Layout>
      <Head>
        <title>Admin - Verifikasi & Laporan</title>
      </Head>
      <div className={styles.container}>
        <header style={{ marginBottom: '2rem' }}>
          <h1>Manajemen Pengguna & Integritas Data</h1>
          <p>Verifikasi pengguna baru, kelola peran, dan pantau kelengkapan data perumahan.</p>
        </header>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.tabContainer}>
          <button
            className={`${styles.tabButton} ${activeTab === 'verification' ? styles.active : ''}`}
            onClick={() => setActiveTab('verification')}
          >
            <FaUserCheck /> Verifikasi
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'roles' ? styles.active : ''}`}
            onClick={() => setActiveTab('roles')}
          >
            <FaUserCog /> Manajemen Peran
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'family' ? styles.active : ''}`}
            onClick={() => setActiveTab('family')}
          >
            <FaUsersSlash /> Keluarga
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'profile' ? styles.active : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <FaUserEdit /> Profil
          </button>
        </div>

        <div className={styles.contentContainer}>
          {activeTab === 'verification' && (
            <UserVerification users={users} onUpdateUser={handleUpdateUser} />
          )}
          {activeTab === 'roles' && (
            <RoleManagement
              users={users}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              onAddUser={handleAddUser}
            />
          )}
          {activeTab === 'family' && (
            <ReportKeluargaIncomplete incompleteFamilies={incompleteFamilies} allWarga={wargaList} />
          )}
          {activeTab === 'profile' && (
            <ReportProfilIncomplete incompleteProfiles={incompleteProfiles} allUsers={users} />
          )}
        </div>
      </div>
    </Layout>
  );
}

export default withAuth(AdminVerificationPage, ['admin']);
