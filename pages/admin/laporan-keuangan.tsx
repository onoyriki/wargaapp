
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { withAuth } from '../../components/withAuth';
import Layout from '../../components/Layout';
import styles from '../../styles/LaporanKeuangan.module.css';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

type IuranSummary = {
  bulan: number;
  tahun: number;
  totalPemasukan: number;
  totalTagihan: number;
  jumlahLunas: number;
  jumlahKeluarga: number;
};

const LaporanKeuangan = () => {
  const [summary, setSummary] = useState<IuranSummary | null>(null);
  const [historicalData, setHistoricalData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchLaporan = async (year: number) => {
    setLoading(true);
    setError(null);
    try {
      // Ambil semua kepala keluarga untuk menghitung total KK
      const keluargaQuery = query(collection(db, 'warga'), where('statusHubungan', '==', 'Kepala Keluarga'));
      const keluargaSnapshot = await getDocs(keluargaQuery);
      const totalKeluarga = new Set(keluargaSnapshot.docs.map(d => d.data().noKK)).size;

      // Ambil semua iuran di tahun yang dipilih
      const iuranQuery = query(collection(db, 'iuran'), where('tahun', '==', year));
      const iuranSnapshot = await getDocs(iuranQuery);
      const iuranData = iuranSnapshot.docs.map(doc => doc.data());

      const monthlyData: { [key: number]: { pemasukan: number; lunas: number; tagihan: number } } = {};

      for (let i = 1; i <= 12; i++) {
        monthlyData[i] = { pemasukan: 0, lunas: 0, tagihan: 0 };
      }
      
      iuranData.forEach(iuran => {
          if(monthlyData[iuran.bulan]){
              monthlyData[iuran.bulan].tagihan += iuran.jumlah;
              if (iuran.status === 'Lunas') {
                  monthlyData[iuran.bulan].pemasukan += iuran.jumlah;
                  monthlyData[iuran.bulan].lunas += 1;
              }
          }
      });

      // Summary untuk bulan ini
      const currentMonth = new Date().getMonth() + 1;
      const currentMonthData = monthlyData[currentMonth];

      setSummary({
        bulan: currentMonth,
        tahun: year,
        totalPemasukan: currentMonthData.pemasukan,
        totalTagihan: currentMonthData.tagihan,
        jumlahLunas: currentMonthData.lunas,
        jumlahKeluarga: totalKeluarga,
      });

      // Data untuk grafik
      const chartLabels = Array.from({ length: 12 }, (_, i) => new Date(0, i).toLocaleString('id-ID', { month: 'short' }));
      const chartData = {
        labels: chartLabels,
        datasets: [
          {
            label: 'Pemasukan Iuran (Rp)',
            data: Object.values(monthlyData).map(d => d.pemasukan),
            backgroundColor: '#34d399',
            borderRadius: 4,
          },
        ],
      };
      setHistoricalData(chartData);

    } catch (e: any) {
      setError(`Gagal mengambil data: ${e.message}`);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaporan(selectedYear);
  }, [selectedYear]);

  const renderYearSelector = () => (
    <select value={selectedYear} onChange={(e) => setSelectedYear(+e.target.value)} className={styles.yearSelector}>
      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
        <option key={y} value={y}>Tahun {y}</option>
      ))}
    </select>
  );
  
  return (
    <Layout>
      <Head><title>Laporan Keuangan - Admin WargaKoba</title></Head>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>Laporan Keuangan Iuran</h1>
          {renderYearSelector()}
        </header>

        {loading && <div className={styles.loading}>Memuat laporan...</div>}
        {error && <div className={styles.error}>{error}</div>}

        {!loading && summary && (
          <>
            <section className={styles.summaryGrid}>
              <div className={styles.summaryCard}>
                <h4>Pemasukan Bulan Ini</h4>
                <p>Rp{summary.totalPemasukan.toLocaleString('id-ID')}</p>
                <span className={styles.cardSubtitle}>Dari target Rp{summary.totalTagihan.toLocaleString('id-ID')}</span>
              </div>
              <div className={styles.summaryCard}>
                <h4>Tingkat Partisipasi</h4>
                <p>{summary.jumlahLunas} / {summary.jumlahKeluarga}</p>
                <span className={styles.cardSubtitle}>Keluarga sudah lunas</span>
              </div>
              <div className={styles.summaryCard}>
                <h4>Persentase Pembayaran</h4>
                <p>{summary.totalTagihan > 0 ? ((summary.jumlahLunas / summary.jumlahKeluarga) * 100).toFixed(1) : 0}%</p>
                <span className={styles.cardSubtitle}>Untuk bulan ini</span>
              </div>
            </section>

            <section className={styles.chartContainer}>
              <h3>Grafik Pemasukan Tahunan (Tahun {selectedYear})</h3>
              {historicalData && (
                <div className={styles.chartWrapper}>
                   <Bar 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          title: {
                            display: true,
                            text: `Total Pemasukan per Bulan - ${selectedYear}`,
                          },
                        },
                        scales: {
                          y: {
                            ticks: { 
                                callback: (value) => `Rp${Number(value) / 1000}k` 
                            }
                          }
                        }
                      }}
                      data={historicalData} 
                    />
                </div>
              )}
            </section>
          </>
        )}
        {!loading && !summary && <p className={styles.noResults}>Data tidak ditemukan.</p>}
      </div>
    </Layout>
  );
};

export default withAuth(LaporanKeuangan, ['admin']);
