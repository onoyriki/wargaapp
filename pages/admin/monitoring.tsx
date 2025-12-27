import { useState, useEffect } from 'react';
import { withAuth } from '../../components/withAuth';
import Layout from '../../components/Layout';
import { db } from '../../lib/firebase';
import { collection, getCountFromServer } from 'firebase/firestore';
import { FaUsers, FaShieldAlt, FaBullhorn, FaAd, FaSync, FaServer, FaChartLine } from 'react-icons/fa';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
} from 'chart.js';
import styles from '../../styles/Monitoring.module.css';

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
);

const MonitoringDashboard = () => {
    const [stats, setStats] = useState({
        warga: 0,
        patrol: 0,
        pengumuman: 0,
        iklan: 0,
        lastUpdated: new Date()
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Efficient Aggregation Queries (Cost-Effective)
            const wargaSnap = await getCountFromServer(collection(db, 'users'));
            const patrolSnap = await getCountFromServer(collection(db, 'patrol_logs'));
            const pengumumanSnap = await getCountFromServer(collection(db, 'pengumuman'));
            const iklanSnap = await getCountFromServer(collection(db, 'iklan'));

            setStats({
                warga: wargaSnap.data().count,
                patrol: patrolSnap.data().count,
                pengumuman: pengumumanSnap.data().count,
                iklan: iklanSnap.data().count,
                lastUpdated: new Date()
            });
        } catch (error: any) {
            console.error("Error fetching stats:", error);
            if (error.code === 'permission-denied') {
                setError("Akses ditolak. Pastikan Anda memiliki peran Admin dan aturan keamanan telah diterapkan.");
            } else {
                setError("Gagal memuat data statistik sistem.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Estimate Storage Usage (Avg 300KB per WebP image)
    // Patrol: 1 image per log
    // Pengumuman: Avg 1 image
    // Iklan: Avg 1 image
    const AVG_IMAGE_SIZE_KB = 300;
    const totalImages = stats.patrol + stats.pengumuman + stats.iklan;
    const estimatedStorageMB = ((totalImages * AVG_IMAGE_SIZE_KB) / 1024).toFixed(2);

    const docData = {
        labels: ['Data Warga', 'Laporan Patroli', 'Pengumuman', 'Iklan'],
        datasets: [
            {
                label: 'Jumlah Dokumen',
                data: [stats.warga, stats.patrol, stats.pengumuman, stats.iklan],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    if (loading) {
        return (
            <Layout title="System Monitoring">
                <div className={styles.loading}>
                    <FaSync className="animate-spin" style={{ marginRight: '10px' }} />
                    Loading System Metrics...
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="System Monitoring">
            <div className={styles.container}>
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>System Health Dashboard</h1>
                        <span className={styles.lastUpdated}>
                            Last Updated: {stats.lastUpdated.toLocaleTimeString()}
                        </span>
                    </div>
                    <button onClick={fetchData} className={styles.refreshButton}>
                        <FaSync style={{ marginRight: '8px' }} /> Refresh Data
                    </button>
                </div>

                {error && (
                    <div style={{ backgroundColor: '#fff5f5', color: '#c53030', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #feb2b2' }}>
                        <strong>⚠️ Error:</strong> {error}
                    </div>
                )}

                <div className={styles.grid}>
                    <div className={styles.card}>
                        <div className={styles.cardIcon}><FaUsers /></div>
                        <div className={styles.cardLabel}>Total Warga</div>
                        <div className={styles.cardValue}>{stats.warga}</div>
                    </div>
                    <div className={styles.card}>
                        <div className={styles.cardIcon} style={{ color: '#e53e3e' }}><FaShieldAlt /></div>
                        <div className={styles.cardLabel}>Total Patroli</div>
                        <div className={styles.cardValue}>{stats.patrol}</div>
                    </div>
                    <div className={styles.card}>
                        <div className={styles.cardIcon} style={{ color: '#d69e2e' }}><FaBullhorn /></div>
                        <div className={styles.cardLabel}>Pengumuman</div>
                        <div className={styles.cardValue}>{stats.pengumuman}</div>
                    </div>
                    <div className={styles.card}>
                        <div className={styles.cardIcon} style={{ color: '#38b2ac' }}><FaServer /></div>
                        <div className={styles.cardLabel}>Est. Storage</div>
                        <div className={styles.cardValue}>{estimatedStorageMB} <span style={{ fontSize: '1rem' }}>MB</span></div>
                    </div>
                </div>

                {/* Billing ESTIMATOR */}
                <div className={styles.grid}>
                    <div className={styles.card} style={{ borderColor: Number(estimatedStorageMB) > 5000 ? '#e53e3e' : '#48bb78', borderLeftWidth: '5px' }}>
                        <div className={styles.cardIcon} style={{ color: '#48bb78' }}>
                            <FaChartLine />
                        </div>
                        <div className={styles.cardLabel}>Est. Biaya (Bulanan)</div>
                        <div className={styles.cardValue}>
                            {Number(estimatedStorageMB) > 5000
                                ? `$${(((Number(estimatedStorageMB) - 5000) / 1024) * 0.026).toFixed(4)}`
                                : '$0.00'
                            }
                        </div>
                        <small style={{ color: '#718096' }}>
                            {Number(estimatedStorageMB) > 5000 ? 'Over Free Limit (Blaze)' : 'Free Tier (Spark) Safe'}
                        </small>
                    </div>
                    <div className={styles.card}>
                        <div className={styles.cardLabel} style={{ marginBottom: '1rem' }}>Aksi Cepat</div>
                        <a
                            href="https://console.firebase.google.com/u/0/project/wargaapp-56a1f/usage"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'block',
                                background: '#3182ce',
                                color: 'white',
                                padding: '0.8rem',
                                borderRadius: '6px',
                                textAlign: 'center',
                                textDecoration: 'none',
                                fontWeight: 'bold'
                            }}
                        >
                            Buka Billing Console ↗
                        </a>
                    </div>
                </div>

                <div className={styles.chartSection}>
                    <h2 className={styles.chartTitle}>Distribusi Data Dokumen</h2>
                    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <Doughnut data={docData} />
                    </div>
                    <div className={styles.storageInfo}>
                        <strong>ℹ️ Info Estimasi Storage:</strong>
                        <br />
                        Kalkulasi berdasarkan asumsi rata-rata file <b>WebP ({AVG_IMAGE_SIZE_KB}KB)</b>.
                        <br />
                        Total Gambar Terdeteksi: <b>{totalImages}</b>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default withAuth(MonitoringDashboard, ['admin']);
