
import { FaUserCheck, FaCheckCircle, FaTimesCircle, FaFilter } from 'react-icons/fa';
import styles from '../styles/Verifikasi.module.css';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useMemo, useState } from 'react';

interface User {
    id: string;
    email: string;
    role: string;
    verified: boolean;
    nama?: string;
}

interface UserVerificationProps {
    users: User[];
    onUpdateUser: (id: string, role: string, verified: boolean, extraData?: Partial<User>) => Promise<void>;
}

const COLORS = ['#10b981', '#f59e0b']; // Green and Amber

export default function UserVerification({ users, onUpdateUser }: UserVerificationProps) {
    const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'unverified'>('all');

    const chartData = useMemo(() => {
        const verifiedCount = users.filter(u => u.verified).length;
        const unverifiedCount = users.length - verifiedCount;
        return [
            { name: 'Terverifikasi', value: verifiedCount },
            { name: 'Belum Diverifikasi', value: unverifiedCount },
        ];
    }, [users]);

    const filteredUsers = useMemo(() => {
        if (filterStatus === 'verified') return users.filter(u => u.verified);
        if (filterStatus === 'unverified') return users.filter(u => !u.verified);
        return users;
    }, [users, filterStatus]);

    return (
        <section className={styles.reportSection}>
            <h2><FaUserCheck /> Verifikasi Pengguna</h2>

            <div className={styles.chartGrid}>
                <div className={styles.chartContainer}>
                    <h3>Status Verifikasi (Total)</h3>
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
                    <p>Daftar pengguna yang memerlukan persetujuan atau pengecekan status verifikasi. Admin dapat memberikan akses penuh kepada warga yang datanya sudah valid.</p>
                </div>
            </div>

            <div className={styles.filterContainer}>
                <label className={styles.filterLabel}><FaFilter /> Filter Status:</label>
                <select
                    className={styles.filterSelect}
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                >
                    <option value="all">Semua Status</option>
                    <option value="verified">Terverifikasi</option>
                    <option value="unverified">Belum Diverifikasi</option>
                </select>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Nama</th>
                            <th>Email</th>
                            <th>Status Verifikasi</th>
                            <th>Tindakan</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user.id}>
                                <td data-label="Nama">{user.nama || '(Belum Diatur)'}</td>
                                <td data-label="Email">{user.email}</td>
                                <td data-label="Verifikasi">
                                    <span className={user.verified ? styles.verifiedStatus : styles.unverifiedStatus}>
                                        {user.verified ? <FaCheckCircle /> : <FaTimesCircle />}
                                        {user.verified ? ' Terverifikasi' : ' Belum Diverifikasi'}
                                    </span>
                                </td>
                                <td data-label="Tindakan">
                                    <button
                                        onClick={() => onUpdateUser(user.id, user.role || 'warga', !user.verified)}
                                        className={`${styles.button} ${user.verified ? styles.unverifyButton : styles.verifyButton}`}
                                    >
                                        {user.verified ? 'Batal Verifikasi' : 'Verifikasi Pengguna'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                            <tr><td colSpan={4} style={{ textAlign: 'center' }}>Tidak ada data pengguna yang sesuai filter.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
