import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/hooks';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const STATUS_COLORS = ['#22c55e', '#ef4444']; // Green for Lengkap, Red for Belum Lengkap

const FamilyStatsChart = ({ title = "Progres Pendataan Warga Cluster Koba Village" }) => {
    const { userData } = useAuth();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalKK, setTotalKK] = useState(0);
    const [isMyFamilyIncomplete, setIsMyFamilyIncomplete] = useState(false);

    useEffect(() => {
        const qW = collection(db, 'warga');
        const unsub = onSnapshot(qW, (snapshot) => {
            const families: { [key: string]: number } = {};
            snapshot.forEach((doc) => {
                const noKK = doc.data().noKK;
                if (noKK) {
                    families[noKK] = (families[noKK] || 0) + 1;
                }
            });

            const completed = Object.values(families).filter(count => count > 1).length;
            const incomplete = Object.values(families).filter(count => count === 1).length;

            setTotalKK(Object.keys(families).length);
            setData([
                { name: 'Sudah Input Anggota', value: completed },
                { name: 'Hanya Kepala Keluarga', value: incomplete },
            ]);

            // Check current user family status
            if (userData?.noKK) {
                setIsMyFamilyIncomplete(families[userData.noKK] === 1);
            }

            setLoading(false);
        });

        return () => unsub();
    }, [userData]);

    if (loading) return <div>Memuat statistik...</div>;

    return (
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: '#333', textAlign: 'center' }}>{title}</h3>
            <div style={{ position: 'relative' }}>
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                        >
                            {data.map((entry, index) => (<Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value} KK`} />
                        <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                </ResponsiveContainer>
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -85%)',
                    textAlign: 'center',
                    pointerEvents: 'none'
                }}>
                    <span style={{ fontSize: '0.8rem', color: '#666', display: 'block' }}>Total KK</span>
                    <strong style={{ fontSize: '1.5rem', color: '#333' }}>{totalKK}</strong>
                </div>
            </div>
            <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#555', textAlign: 'center', lineHeight: '1.5' }}>
                <p style={{ fontWeight: 500 }}>Ayo lengkapi data anggota keluarga Anda!</p>
                {isMyFamilyIncomplete && (
                    <p style={{ color: '#ef4444', marginTop: '0.3rem' }}>
                        Anda belum ada anggota keluarga, segera tambahkan. <br />
                        Minimal punya istri kecuali masih bujang 😊
                    </p>
                )}
            </div>
        </div>
    );
};

export default FamilyStatsChart;
