
import { useEffect, useState, useMemo } from 'react';
import Head from 'next/head';
import { collection, getDocs, doc, updateDoc, DocumentData } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/hooks';
import { withAuth } from '../../components/withAuth';
import Layout from '../../components/Layout';
import styles from '../../styles/Admin.module.css';
import { FaCheckCircle, FaTimesCircle, FaUsersSlash, FaUserEdit, FaUserCheck } from 'react-icons/fa';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

function AdminVerificationPage() {
  const { userData } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [wargaList, setWargaList] = useState<Warga[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            wargaDataMap.set(warga.email, { noKK: warga.noKK, alamatBlok: warga.alamatBlok, nama: warga.nama });
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

  const handleUpdateUser = async (id: string, newRole: string, newVerifiedStatus: boolean) => {
    try {
      const userDocRef = doc(db, 'users', id);
      await updateDoc(userDocRef, { role: newRole, verified: newVerifiedStatus });
      setUsers(users.map(user => (user.id === id ? { ...user, role: newRole, verified: newVerifiedStatus } : user)));
    } catch (error) {
      console.error("Gagal memperbarui pengguna:", error);
      alert('Gagal memperbarui pengguna.');
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

  const roleData = useMemo(() => {
    const rolesCount = users.reduce((acc, user) => {
      const role = user.role || 'warga';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.keys(rolesCount).map(role => ({ name: role.charAt(0).toUpperCase() + role.slice(1), value: rolesCount[role] }));
  }, [users]);

  const verificationData = useMemo(() => {
    const verifiedCount = users.filter(u => u.verified).length;
    const unverifiedCount = users.length - verifiedCount;
    return [
      { name: 'Terverifikasi', value: verifiedCount },
      { name: 'Belum Diverifikasi', value: unverifiedCount },
    ];
  }, [users]);

  const ROLE_COLORS = { Warga: '#0088FE', Admin: '#00C49F', Satpam: '#FFBB28' };
  const VERIFICATION_COLORS = { Terverifikasi: '#00C49F', 'Belum Diverifikasi': '#FF8042' };

  if (loading) {
    return <Layout><div className={styles.loadingContainer}>Memuat data pengguna...</div></Layout>;
  }

  if (userData?.role !== 'admin') {
    return <Layout><p className={styles.error}>Akses Ditolak. Anda harus menjadi admin untuk melihat halaman ini.</p></Layout>;
  }

  return (
    <Layout>
      <Head>
        <title>Admin - Verifikasi Pengguna & Integritas Data</title>
      </Head>
      <div className={styles.adminContainer}>
        <header className={styles.pageHeader}>
          <h1>Manajemen Pengguna & Integritas Data</h1>
          <p>Verifikasi pengguna baru, kelola peran, dan pantau kelengkapan data.</p>
        </header>

        {error && <p className={styles.error}>{error}</p>}

        <section className={styles.chartGrid}>
          <div className={styles.chartContainer}>
            <h3>Distribusi Pengguna per Peran</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={roleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                  {roleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={ROLE_COLORS[entry.name as keyof typeof ROLE_COLORS]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className={styles.chartContainer}>
            <h3>Status Verifikasi Pengguna</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={verificationData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#82ca9d" label>
                  {verificationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={VERIFICATION_COLORS[entry.name as keyof typeof VERIFICATION_COLORS]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
        
        <section className={styles.reportSection}>
            <h2><FaUsersSlash style={{ marginRight: '10px' }} />Keluarga Belum Lengkap</h2>
            <p>Daftar Kartu Keluarga (KK) yang saat ini hanya memiliki satu anggota terdaftar. Kepala Keluarga disarankan untuk melengkapi data anggotanya.</p>
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Nama Anggota</th>
                            <th>Status</th>
                            <th>No. KK</th>
                        </tr>
                    </thead>
                    <tbody>
                        {incompleteFamilies.length > 0 ? incompleteFamilies.map(warga => (
                            <tr key={warga.id}>
                                <td data-label="Nama Anggota">{warga.nama || '(Belum Diatur)'}</td>
                                <td data-label="Status">{warga.statusInFamily || '(Belum Diatur)'}</td>
                                <td data-label="No. KK">{warga.noKK}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan={3}>Semua keluarga memiliki lebih dari satu anggota.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>

        <section className={styles.reportSection}>
            <h2><FaUserEdit style={{ marginRight: '10px' }} />Warga dengan Profil Tidak Lengkap</h2>
            <p>Pengguna dengan peran 'warga' yang belum melengkapi profil mereka (No. KK atau Alamat).</p>
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Nama</th>
                            <th>Email</th>
                            <th>No. KK</th>
                            <th>Alamat Blok</th>
                        </tr>
                    </thead>
                    <tbody>
                        {incompleteProfiles.length > 0 ? incompleteProfiles.map(user => (
                            <tr key={user.id}>
                                <td data-label="Nama">{user.nama || '(Belum Diatur)'}</td>
                                <td data-label="Email">{user.email}</td>
                                <td data-label="No. KK">{user.noKK || <span className={styles.missingData}>Kosong</span>}</td>
                                <td data-label="Alamat Blok">{user.alamatBlok || <span className={styles.missingData}>Kosong</span>}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan={4}>Semua profil warga sudah lengkap.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>

        <section className={styles.reportSection}>
            <h2><FaUserCheck style={{ marginRight: '10px' }} />Verifikasi Pengguna & Manajemen Peran</h2>
            <div className={styles.tableContainer}>
            <table className={styles.table}>
                <thead>
                <tr>
                    <th>Email</th>
                    <th>Peran Saat Ini</th>
                    <th>Status Verifikasi</th>
                    <th>Tindakan</th>
                </tr>
                </thead>
                <tbody>
                {users.map(user => (
                    <tr key={user.id}>
                    <td data-label="Email">{user.email}</td>
                    <td data-label="Peran">
                        <select
                        value={user.role || 'warga'}
                        onChange={(e) => handleUpdateUser(user.id, e.target.value, user.verified)}
                        className={styles.select}
                        >
                        <option value="warga">Warga</option>
                        <option value="satpam">Satpam</option>
                        <option value="admin">Admin</option>
                        </select>
                    </td>
                    <td data-label="Verifikasi">
                        <span className={user.verified ? styles.verifiedStatus : styles.unverifiedStatus}>
                            {user.verified ? <FaCheckCircle /> : <FaTimesCircle />}
                            {user.verified ? ' Terverifikasi' : ' Belum Diverifikasi'}
                        </span>
                    </td>
                    <td data-label="Tindakan">
                        <button
                        onClick={() => handleUpdateUser(user.id, user.role || 'warga', !user.verified)}
                        className={`${styles.button} ${user.verified ? styles.unverifyButton : styles.verifyButton}`}>
                        {user.verified ? 'Batal Verifikasi' : 'Verifikasi Pengguna'}
                        </button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        </section>

      </div>
    </Layout>
  );
}

export default withAuth(AdminVerificationPage, ['admin']);
