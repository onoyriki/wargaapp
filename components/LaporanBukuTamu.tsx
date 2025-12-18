
import { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import styles from '../styles/Reports.module.css';
import { FaBook, FaSearch, FaCamera } from 'react-icons/fa';

interface TamuReport {
  id: string;
  namaTamu: string;
  noKtp: string;
  noKendaraan: string;
  tujuan: string;
  keperluan: string;
  fotoKtpUrl: string;
  satpamName: string;
  waktuMasuk: any;
}

export default function LaporanBukuTamu() {
  const [reports, setReports] = useState<TamuReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const q = query(collection(db, 'buku_tamu'), orderBy('waktuMasuk', 'desc'));
        const querySnapshot = await getDocs(q);
        const reportsList = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            waktuMasuk: data.waktuMasuk?.toDate().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'long' }) || 'N/A',
          } as TamuReport;
        });
        setReports(reportsList);
      } catch (err) {
        console.error("Error fetching reports:", err);
        setError('Gagal memuat laporan buku tamu.');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const filteredReports = useMemo(() => {
    return reports.filter(report =>
      report.namaTamu.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, reports]);

  return (
      <div className={styles.reportContainer}>
        <header className={styles.reportHeader}>
          <h1><FaBook style={{ marginRight: '15px' }} />Laporan Buku Tamu</h1>
          <p>Tinjau semua catatan tamu yang masuk ke perumahan.</p>
        </header>

        {loading && <p>Memuat laporan...</p>}
        {error && <p className={styles.errorMessage}>{error}</p>}
        
        <div className={styles.filterContainer}>
          <div className={styles.searchBox}>
            <FaSearch className={styles.searchIcon} />
            <input 
              type="text"
              placeholder="Cari berdasarkan nama tamu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {!loading && !error && (
          <div className={styles.tableContainer}>
            <table className={styles.reportTable}>
              <thead>
                <tr>
                  <th>Waktu Masuk</th>
                  <th>Nama Tamu</th>
                  <th>No. KTP</th>
                  <th>No. Kendaraan</th>
                  <th>Tujuan</th>
                  <th>Keperluan</th>
                  <th>Foto KTP</th>
                  <th>Dicatat oleh</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.length > 0 ? (
                  filteredReports.map(report => (
                    <tr key={report.id}>
                      <td data-label="Waktu Masuk">{report.waktuMasuk}</td>
                      <td data-label="Nama Tamu">{report.namaTamu}</td>
                      <td data-label="No. KTP">{report.noKtp}</td>
                      <td data-label="No. Kendaraan">{report.noKendaraan}</td>
                      <td data-label="Tujuan">{report.tujuan}</td>
                      <td data-label="Keperluan">{report.keperluan}</td>
                      <td data-label="Foto KTP">
                        <a href={report.fotoKtpUrl} target="_blank" rel="noopener noreferrer" className={styles.link}>
                          <FaCamera /> Lihat Foto
                        </a>
                      </td>
                      <td data-label="Dicatat oleh">{report.satpamName}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8}>Tidak ada laporan yang cocok dengan pencarian Anda.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
  );
}
