
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { collection, query, where, getDocs, Timestamp, writeBatch, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { withAuth } from '../../components/withAuth';
import Layout from '../../components/Layout';
import styles from '../../styles/KelolaIuran.module.css';
import { FaFileInvoiceDollar, FaCheckCircle } from 'react-icons/fa';

// Definisikan tipe data untuk Iuran
type Iuran = {
  id: string;
  noKK: string;
  bulan: number; // 1-12
  tahun: number;
  jumlah: number;
  status: 'Lunas' | 'Belum Lunas';
  tanggalBayar?: Timestamp;
  kepalaKeluarga?: string; 
};

// Definisikan tipe untuk data keluarga
type Keluarga = {
    noKK: string;
    kepalaKeluarga: string;
};

const KelolaIuran = () => {
  const [iuran, setIuran] = useState<Iuran[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchIuran = async (month: number, year: number) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Ambil semua data keluarga (noKK dan kepala keluarga)
      const keluargaQuery = query(collection(db, 'warga'), where('statusHubungan', '==', 'Kepala Keluarga'));
      const keluargaSnapshot = await getDocs(keluargaQuery);
      const daftarKeluarga: Keluarga[] = keluargaSnapshot.docs.map(doc => ({ noKK: doc.data().noKK, kepalaKeluarga: doc.data().nama }));
      const uniqueKeluarga = Array.from(new Map(daftarKeluarga.map(item => [item.noKK, item])).values());
      
      // 2. Ambil data iuran yang ada untuk bulan dan tahun yang dipilih
      const iuranQuery = query(collection(db, 'iuran'), where('bulan', '==', month), where('tahun', '==', year));
      const iuranSnapshot = await getDocs(iuranQuery);
      const iuranMap = new Map(iuranSnapshot.docs.map(doc => [doc.data().noKK, { id: doc.id, ...doc.data() } as Iuran]));

      // 3. Gabungkan data keluarga dengan data iuran
      const iuranData = uniqueKeluarga.map(keluarga => {
        const iuranRecord = iuranMap.get(keluarga.noKK);
        return {
          id: iuranRecord?.id || `${keluarga.noKK}-${year}-${month}`,
          noKK: keluarga.noKK,
          kepalaKeluarga: keluarga.kepalaKeluarga,
          bulan: month,
          tahun: year,
          jumlah: iuranRecord?.jumlah || 100000, // Default iuran
          status: iuranRecord?.status || 'Belum Lunas',
          tanggalBayar: iuranRecord?.tanggalBayar,
        };
      });

      setIuran(iuranData);
    } catch (e: any) {
      setError(`Gagal mengambil data: ${e.message}`);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIuran(selectedDate.month, selectedDate.year);
  }, [selectedDate]);

  const handleGenerateTagihan = async () => {
    setIsGenerating(true);
    setError(null);
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();

    if (!window.confirm(`Anda akan membuat tagihan iuran untuk bulan ${month}/${year} untuk semua Kepala Keluarga. Lanjutkan?`)) {
        setIsGenerating(false);
        return;
    }

    try {
        const batch = writeBatch(db);

        // Ambil semua kepala keluarga
        const keluargaQuery = query(collection(db, 'warga'), where('statusHubungan', '==', 'Kepala Keluarga'));
        const keluargaSnapshot = await getDocs(keluargaQuery);
        const uniqueNoKKs = Array.from(new Set(keluargaSnapshot.docs.map(d => d.data().noKK)));

        // Ambil iuran yang sudah ada untuk bulan ini
        const iuranExistingQuery = query(collection(db, 'iuran'), where('bulan', '==', month), where('tahun', '==', year));
        const iuranExistingSnapshot = await getDocs(iuranExistingQuery);
        const existingKKs = new Set(iuranExistingSnapshot.docs.map(d => d.data().noKK));

        let tagihanDibuat = 0;
        uniqueNoKKs.forEach(noKK => {
            if (!existingKKs.has(noKK)) {
                const iuranId = `${noKK}-${year}-${month}`;
                const newIuranRef = doc(db, 'iuran', iuranId);
                batch.set(newIuranRef, {
                    noKK,
                    bulan: month,
                    tahun: year,
                    jumlah: 100000, // Iuran default
                    status: 'Belum Lunas'
                });
                tagihanDibuat++;
            }
        });

        if (tagihanDibuat > 0) {
            await batch.commit();
            alert(`${tagihanDibuat} tagihan baru berhasil dibuat!`);
        } else {
            alert('Semua tagihan untuk bulan ini sudah ada.');
        }

        fetchIuran(selectedDate.month, selectedDate.year); // Refresh data
    } catch (e: any) {
        setError(`Gagal membuat tagihan: ${e.message}`);
        console.error(e);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSetLunas = async (id: string, noKK: string) => {
    try {
        const iuranRef = doc(db, 'iuran', id);
        await writeBatch(db).set(iuranRef, {
            noKK,
            bulan: selectedDate.month,
            tahun: selectedDate.year,
            jumlah: 100000, // Pastikan jumlah konsisten
            status: 'Lunas',
            tanggalBayar: Timestamp.now()
        }, { merge: true }).commit();
        
        // Optimistic update
        setIuran(prev => prev.map(item => item.id === id ? { ...item, status: 'Lunas', tanggalBayar: Timestamp.now() } : item));
    } catch (e: any) {
        setError(`Gagal memperbarui status: ${e.message}`);
        console.error(e);
    }
  };
  
  const renderMonthYearSelectors = () => {
    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    
    return (
      <div className={styles.selectors}>
        <select value={selectedDate.month} onChange={(e) => setSelectedDate(d => ({ ...d, month: +e.target.value }))}>
          {months.map(m => <option key={m} value={m}>{new Date(0, m-1).toLocaleString('id-ID', { month: 'long' })}</option>)}
        </select>
        <select value={selectedDate.year} onChange={(e) => setSelectedDate(d => ({ ...d, year: +e.target.value }))}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
    );
  };

  return (
    <Layout>
      <Head><title>Kelola Iuran - Admin WargaKoba</title></Head>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>Kelola Iuran Warga</h1>
          <div className={styles.controls}>
            {renderMonthYearSelectors()}
            <button onClick={handleGenerateTagihan} disabled={isGenerating} className={styles.generateButton}>
              <FaFileInvoiceDollar />
              {isGenerating ? 'Memproses...' : 'Generate Tagihan Bulan Ini'}
            </button>
          </div>
        </header>
        
        {loading && <div className={styles.loading}>Memuat data iuran...</div>}
        {error && <div className={styles.error}>{error}</div>}
        
        {!loading && !error && (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>No. KK</th>
                  <th>Kepala Keluarga</th>
                  <th>Jumlah</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {iuran.map((item) => (
                  <tr key={item.id} className={item.status === 'Lunas' ? styles.lunas : ''}>
                    <td data-label="No. KK">{item.noKK}</td>
                    <td data-label="Kepala Keluarga">{item.kepalaKeluarga || 'N/A'}</td>
                    <td data-label="Jumlah">{`Rp${item.jumlah.toLocaleString('id-ID')}`}</td>
                    <td data-label="Status">
                      <span className={`${styles.status} ${item.status === 'Lunas' ? styles.statusLunas : styles.statusBelumLunas}`}>
                        {item.status}
                      </span>
                    </td>
                    <td data-label="Aksi">
                      {item.status === 'Belum Lunas' && (
                        <button onClick={() => handleSetLunas(item.id, item.noKK)} className={styles.actionButton}>
                          <FaCheckCircle /> Tandai Lunas
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {iuran.length === 0 && <p className={styles.noResults}>Tidak ada data iuran untuk periode ini.</p>}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default withAuth(KelolaIuran, ['admin']);
