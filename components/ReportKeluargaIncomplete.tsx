
import { FaUsersSlash } from 'react-icons/fa';
import styles from '../styles/Verifikasi.module.css';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';

interface Warga {
    id: string;
    nama: string;
    noKK: string;
    statusInFamily: string;
}

interface ReportKeluargaIncompleteProps {
    incompleteFamilies: Warga[];
    allWarga: Warga[];
}

const COLORS = ['#10b981', '#ef4444']; // Green and Red

export default function ReportKeluargaIncomplete({ incompleteFamilies, allWarga }: ReportKeluargaIncompleteProps) {
    const chartData = useMemo(() => {
        const totalKKs = new Set(allWarga.map(w => w.noKK).filter(Boolean)).size;
        const incompleteKKs = new Set(incompleteFamilies.map(w => w.noKK)).size;
        const completeKKs = totalKKs - incompleteKKs;

        return [
            { name: 'Keluarga Lengkap', value: completeKKs },
            { name: 'Keluarga Belum Lengkap', value: incompleteKKs },
        ];
    }, [allWarga, incompleteFamilies]);

    return (
        <section className={styles.reportSection}>
            <h2><FaUsersSlash /> Keluarga Belum Lengkap</h2>

            <div className={styles.chartGrid}>
                <div className={styles.chartContainer}>
                    <h3>Kelengkapan Keluarga</h3>
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
                    <p>Daftar Kartu Keluarga (KK) yang saat ini hanya memiliki satu anggota terdaftar. Kepala Keluarga disarankan untuk melengkapi data anggotanya agar data kependudukan akurat.</p>
                </div>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Nama Anggota</th>
                            <th>Status</th>
                            <th>No. KK</th>
                        </tr>
                    </thead>
                    <tbody>
                        {incompleteFamilies.length > 0 ? incompleteFamilies.map(warga => (
                            <tr key={warga.id}>
                                <td data-label="Nama Anggota">{warga.nama || '(Belum Diatur)'}</td>
                                <td data-label="Status">{warga.statusInFamily || '(Belum Diatur)'}</td>
                                <td data-label="No. KK">{warga.noKK}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan={3} style={{ textAlign: 'center' }}>Semua keluarga memiliki lebih dari satu anggota.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
