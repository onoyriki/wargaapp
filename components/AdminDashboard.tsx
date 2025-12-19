
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import styles from '../styles/Dashboard.module.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Warga {
    id: string;
    tanggalLahir: any;
    jenisKelamin: string;
}

// Loosened type definitions to be compatible with recharts
interface ChartData {
    name: string;
    jumlah: number;
    [key: string]: any;
}

interface GenderData {
    name: string;
    value: number;
    [key: string]: any;
}

const calculateAge = (timestamp: any): number => {
    if (!timestamp || !timestamp.toDate) return -1;
    const birthDate = timestamp.toDate();
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

const COLORS = ['#0088FE', '#FF8042']; // Blue for Male, Orange for Female

const AdminDashboard = () => {
    const [totalWarga, setTotalWarga] = useState(0);
    const [genderData, setGenderData] = useState<GenderData[]>([]);
    const [ageGroupData, setAgeGroupData] = useState<ChartData[]>([]);
    const [schoolAgeData, setSchoolAgeData] = useState<ChartData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pengumuman, setPengumuman] = useState<any[]>([]);

    useEffect(() => {
        setLoading(true);
        // Snapshot 1: Pengumuman
        const qP = query(collection(db, 'pengumuman'), orderBy('createdAt', 'desc'));
        const unsubP = onSnapshot(qP, (snap) => {
            setPengumuman(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (err) => console.error("Error pengumuman:", err));

        // Snapshot 2: Warga
        const qW = collection(db, 'warga');
        const unsubW = onSnapshot(qW, (snapshot) => {
            const data: Warga[] = [];
            snapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() } as Warga);
            });

            setTotalWarga(data.length);

            const lakiLaki = data.filter(w => w.jenisKelamin === 'Laki-laki').length;
            const perempuan = data.length - lakiLaki;
            setGenderData([
                { name: 'Laki-laki', value: lakiLaki },
                { name: 'Perempuan', value: perempuan },
            ]);

            let balita = 0, anak = 0, remaja = 0, dewasa = 0, praLansia = 0, lansia = 0;
            let tk = 0, sd = 0, sltp = 0, slta = 0, kuliah = 0;

            data.forEach(warga => {
                const age = calculateAge(warga.tanggalLahir);
                if (age < 0) return;
                if (age <= 5) balita++; else if (age <= 11) anak++; else if (age <= 17) remaja++; else if (age <= 50) dewasa++; else if (age <= 60) praLansia++; else lansia++;
                if (age >= 4 && age <= 6) tk++; if (age >= 7 && age <= 12) sd++; if (age >= 13 && age <= 15) sltp++; if (age >= 16 && age <= 18) slta++; if (age >= 19 && age <= 24) kuliah++;
            });

            setAgeGroupData([
                { name: 'Balita (0-5)', jumlah: balita }, { name: 'Anak (6-11)', jumlah: anak }, { name: 'Remaja (12-17)', jumlah: remaja },
                { name: 'Dewasa (18-50)', jumlah: dewasa }, { name: 'Pra Lansia (51-60)', jumlah: praLansia }, { name: 'Lansia (>60)', jumlah: lansia },
            ]);

            setSchoolAgeData([
                { name: 'TK (4-6)', jumlah: tk }, { name: 'SD (7-12)', jumlah: sd }, { name: 'SLTP (13-15)', jumlah: sltp },
                { name: 'SLTA (16-18)', jumlah: slta }, { name: 'Kuliah (19-24)', jumlah: kuliah },
            ]);

            setLoading(false);
        }, (err) => {
            console.error("Error warga:", err);
            setError('Gagal memuat data demografi.');
            setLoading(false);
        });

        return () => {
            unsubP();
            unsubW();
        };
    }, []);

    if (loading) return <div className={styles.loading}>Memuat data dan grafik...</div>;
    if (error) return <div className={styles.error}>{error}</div>;

    return (
        <div className={styles.adminDashboard}>
            <div className={styles.chartGrid}>
                <div className={styles.pieChartContainer}>
                    <h3>Komposisi Gender</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                {genderData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                            </Pie>
                            <Tooltip formatter={(value) => `${value} orang`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className={styles.pieCenterText}><span>Total</span>{totalWarga}</div>
                </div>
                <div className={styles.chartContainer}>
                    <h3>Kelompok Usia</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={ageGroupData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" fontSize={12} angle={-30} textAnchor="end" height={70} />
                            <YAxis />
                            <Tooltip formatter={(value) => `${value} orang`} />
                            <Bar dataKey="jumlah" fill="#8884d8" name="Jumlah" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className={styles.fullWidthChartContainer}>
                <h3>Pengumuman Terbaru</h3>
                <div className={styles.announcementMiniList}>
                    {pengumuman.slice(0, 3).map(p => (
                        <div key={p.id} className={styles.announcementMiniItem}>
                            <strong>{p.judul}</strong>
                            <small>{p.penulis} | {p.createdAt?.toDate().toLocaleDateString()}</small>
                        </div>
                    ))}
                    {pengumuman.length === 0 && <p>Belum ada pengumuman.</p>}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
