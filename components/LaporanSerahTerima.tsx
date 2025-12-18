
import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import styles from '../styles/Reports.module.css';
import { FaClipboardList } from 'react-icons/fa';

interface SerahTerimaReport {
  id: string;
  shift: string;
  kondisi: string;
  kejadian: string;
  inventaris: string;
  satpamName: string;
  createdAt: any;
}

export default function LaporanSerahTerima() {
  const [reports, setReports] = useState<SerahTerimaReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<SerahTerimaReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shiftFilter, setShiftFilter] = useState('Semua');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const q = query(collection(db, 'serah_terima'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const reportsList = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) || 'N/A',
          } as SerahTerimaReport;
        });
        setReports(reportsList);
        setFilteredReports(reportsList);
      } catch (err) {
        console.error("Error fetching reports:", err);
        setError('Gagal memuat laporan serah terima.');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  useEffect(() => {
    if (shiftFilter === 'Semua') {
      setFilteredReports(reports);
    } else {
      setFilteredReports(reports.filter(report => report.shift === shiftFilter));
    }
  }, [shiftFilter, reports]);

  return (
      <div className={styles.reportContainer}>
        <header className={styles.reportHeader}>
          <h1><FaClipboardList style={{ marginRight: '15px' }} />Laporan Serah Terima Shift</h1>
          <p>Tinjau semua catatan serah terima yang dikirim oleh petugas keamanan.</p>
        </header>

        {loading && <p>Memuat laporan...</p>}
        {error && <p className={styles.errorMessage}>{error}</p>}

        <div className={styles.filterContainer}>
          <label htmlFor="shiftFilter">Filter berdasarkan Shift: </label>
          <select id="shiftFilter" value={shiftFilter} onChange={(e) => setShiftFilter(e.target.value)}>
            <option value="Semua">Semua Shift</option>
            <option value="Pagi">Pagi</option>
            <option value="Siang">Siang</option>
            <option value="Malam">Malam</option>
          </select>
        </div>

        {!loading && !error && (
          <div className={styles.tableContainer}>
            <table className={styles.reportTable}>
              <thead>
                <tr>
                  <th>Tanggal & Waktu</th>
                  <th>Nama Satpam</th>
                  <th>Shift</th>
                  <th>Kondisi Keamanan</th>
                  <th>Kejadian Khusus</th>
                  <th>Inventaris</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.length > 0 ? (
                  filteredReports.map(report => (
                    <tr key={report.id}>
                      <td data-label="Tanggal">{report.createdAt}</td>
                      <td data-label="Satpam">{report.satpamName}</td>
                      <td data-label="Shift">{report.shift}</td>
                      <td data-label="Kondisi">{report.kondisi}</td>
                      <td data-label="Kejadian">{report.kejadian}</td>
                      <td data-label="Inventaris">{report.inventaris}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>Tidak ada laporan yang ditemukan untuk filter ini.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
  );
}
