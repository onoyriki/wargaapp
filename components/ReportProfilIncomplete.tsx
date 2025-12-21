
import { FaUserEdit } from 'react-icons/fa';
import styles from '../styles/Verifikasi.module.css';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';

interface User {
    id: string;
    email: string;
    role: string;
    noKK?: string;
    alamatBlok?: string;
    nama?: string;
}

interface ReportProfilIncompleteProps {
    incompleteProfiles: User[];
    allUsers: User[];
}

const COLORS = ['#10b981', '#f59e0b']; // Green and Amber

export default function ReportProfilIncomplete({ incompleteProfiles, allUsers }: ReportProfilIncompleteProps) {
    const chartData = useMemo(() => {
        const wargaUsers = allUsers.filter(u => u.role === 'warga');
        const incompleteCount = incompleteProfiles.length;
        const completeCount = wargaUsers.length - incompleteCount;

        return [
            { name: 'Profil Lengkap', value: completeCount },
            { name: 'Profil Belum Lengkap', value: incompleteCount },
        ];
    }, [allUsers, incompleteProfiles]);

    return (
        <section className={styles.reportSection}>
            <h2><FaUserEdit /> Warga dengan Profil Tidak Lengkap</h2>

            <div className={styles.chartGrid}>
                <div className={styles.chartContainer}>
                    <h3>Kelengkapan Profil</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                label
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div>
                    <p>Pengguna dengan peran 'warga' yang belum melengkapi profil mereka (No. KK atau Alamat). Warga diwajibkan melengkapi data ini untuk mempermudah administrasi lingkungan.</p>
                </div>
            </div>

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
                            <tr><td colSpan={4} style={{ textAlign: 'center' }}>Semua profil warga sudah lengkap.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
