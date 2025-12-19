
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useAuth } from '../lib/hooks';
import { withAuth } from '../components/withAuth';
import Layout from '../components/Layout';
import styles from '../styles/IuranSaya.module.css';
import { FaSyncAlt, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

type Iuran = {
  id: string;
  bulan: number;
  tahun: number;
  jumlah: number;
  status: 'Lunas' | 'Belum Lunas';
  tanggalBayar?: { seconds: number; nanoseconds: number; };
};

const IuranSaya = () => {
  const { user, userData, loading: authLoading } = useAuth();
  const [iuran, setIuran] = useState<Iuran[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');


  useEffect(() => {
    const fetchIuran = async () => {
      if (!userData || !userData.noKK || authLoading) return;

      setLoading(true);
      setError(null);

      try {
        console.log('[IuranSaya] Querying iuran for noKK:', userData.noKK);
        const iuranQuery = query(
          collection(db, 'iuran'),
          where('noKK', '==', userData.noKK)
        );
        const iuranSnapshot = await getDocs(iuranQuery);
        console.log('[IuranSaya] Snapshot size:', iuranSnapshot.size);

        const iuranData = iuranSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Iuran))
          .sort((a, b) => {
            if (b.tahun !== a.tahun) return b.tahun - a.tahun;
            return b.bulan - a.bulan;
          });

        setIuran(iuranData);
      } catch (e: any) {
        setError(e.message);
        console.error('[IuranSaya] Query Error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchIuran();
  }, [userData, authLoading]);

  const formatBulanTahun = (bulan: number, tahun: number) => {
    return `${new Date(0, bulan - 1).toLocaleString('id-ID', { month: 'long' })} ${tahun}`;
  };

  const formatDate = (timestamp: { seconds: number; nanoseconds: number; } | undefined) => {
    if (!timestamp) return '-';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  };

  return (
    <Layout>
      <Head><title>Status Iuran Saya - WargaKoba</title></Head>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>Status Iuran Keluarga</h1>
        </header>

        {authLoading || (loading && !error) ? (
          <div className={styles.loading}>Memuat riwayat iuran...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '2rem', background: '#fff0f0', border: '1px solid #ffcaca', borderRadius: '12px', color: '#c00' }}>
            <FaExclamationTriangle style={{ fontSize: '2rem' }} />
            <h3>Akses Ditolak</h3>
            <p>{error}</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Periode</th>
                  <th>Jumlah</th>
                  <th>Status</th>
                  <th>Tanggal Pembayaran</th>
                </tr>
              </thead>
              <tbody>
                {iuran.map((item) => (
                  <tr key={item.id} className={item.status === 'Lunas' ? styles.lunas : ''}>
                    <td data-label="Periode">{formatBulanTahun(item.bulan, item.tahun)}</td>
                    <td data-label="Jumlah">{`Rp${item.jumlah.toLocaleString('id-ID')}`}</td>
                    <td data-label="Status">
                      <span className={`${styles.status} ${item.status === 'Lunas' ? styles.statusLunas : styles.statusBelumLunas}`}>
                        {item.status}
                      </span>
                    </td>
                    <td data-label="Tgl. Bayar">{formatDate(item.tanggalBayar)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {iuran.length === 0 && <p className={styles.noResults}>Belum ada riwayat iuran yang tercatat untuk keluarga Anda.</p>}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default withAuth(IuranSaya, ['warga', 'admin']); // Allow admin to see this page too for checking
