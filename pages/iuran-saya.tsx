
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/hooks';
import { withAuth } from '../components/withAuth';
import Layout from '../components/Layout';
import styles from '../styles/IuranSaya.module.css';

type Iuran = {
  id: string;
  bulan: number;
  tahun: number;
  jumlah: number;
  status: 'Lunas' | 'Belum Lunas';
  tanggalBayar?: { seconds: number; nanoseconds: number; };
};

const IuranSaya = () => {
  const { userData, loading: authLoading } = useAuth();
  const [iuran, setIuran] = useState<Iuran[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIuran = async () => {
      if (!userData || !userData.noKK || authLoading) return;
      
      setLoading(true);
      setError(null);

      try {
        const iuranQuery = query(
          collection(db, 'iuran'), 
          where('noKK', '==', userData.noKK),
          orderBy('tahun', 'desc'),
          orderBy('bulan', 'desc')
        );
        const iuranSnapshot = await getDocs(iuranQuery);
        const iuranData = iuranSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Iuran));
        setIuran(iuranData);
      } catch (e: any) {
        setError(`Gagal mengambil data iuran: ${e.message}`);
        console.error(e);
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
          <p>No. KK: {userData?.noKK}</p>
        </header>

        {authLoading || loading && <div className={styles.loading}>Memuat riwayat iuran...</div>}
        {error && <div className={styles.error}>{error}</div>}

        {!loading && !error && (
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
