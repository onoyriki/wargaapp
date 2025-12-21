
import { FaUserEdit, FaFilter, FaPlus, FaTrash, FaEdit, FaTimes } from 'react-icons/fa';
import styles from '../styles/Verifikasi.module.css';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useMemo, useState } from 'react';

interface User {
    id: string;
    email: string;
    role: string;
    verified: boolean;
    nama?: string;
    noKK?: string;
    alamatBlok?: string;
}

interface RoleManagementProps {
    users: User[];
    onUpdateUser: (id: string, role: string, verified: boolean, extraData?: Partial<User>) => Promise<void>;
    onDeleteUser: (id: string) => Promise<void>;
    onAddUser: (userData: Partial<User>) => Promise<boolean>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b']; // Blue, Green, Amber

export default function RoleManagement({ users, onUpdateUser, onDeleteUser, onAddUser }: RoleManagementProps) {
    const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'satpam' | 'warga'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        nama: '',
        email: '',
        role: 'warga',
        noKK: '',
        alamatBlok: ''
    });

    const chartData = useMemo(() => {
        const rolesCount = users.reduce((acc, user) => {
            const role = user.role || 'warga';
            acc[role] = (acc[role] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.keys(rolesCount).map(role => ({
            name: role.charAt(0).toUpperCase() + role.slice(1),
            value: rolesCount[role]
        }));
    }, [users]);

    const filteredUsers = useMemo(() => {
        if (filterRole === 'all') return users;
        return users.filter(u => (u.role || 'warga') === filterRole);
    }, [users, filterRole]);

    const handleOpenAddModal = () => {
        setEditingUser(null);
        setFormData({ nama: '', email: '', role: 'warga', noKK: '', alamatBlok: '' });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (user: User) => {
        setEditingUser(user);
        setFormData({
            nama: user.nama || '',
            email: user.email || '',
            role: user.role || 'warga',
            noKK: user.noKK || '',
            alamatBlok: user.alamatBlok || ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingUser) {
            await onUpdateUser(editingUser.id, formData.role, editingUser.verified, {
                nama: formData.nama,
                email: formData.email,
                noKK: formData.noKK,
                alamatBlok: formData.alamatBlok
            });
        } else {
            const success = await onAddUser(formData);
            if (!success) return;
        }
        setIsModalOpen(false);
    };

    return (
        <section className={styles.reportSection}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2><FaUserEdit /> Manajemen Peran</h2>
                <button className={styles.addButton} onClick={handleOpenAddModal}>
                    <FaPlus /> Tambah Pengguna
                </button>
            </div>

            <div className={styles.chartGrid}>
                <div className={styles.chartContainer}>
                    <h3>Distribusi Peran (Total)</h3>
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
                    <p>Atur hak akses pengguna dengan mengubah peran mereka sesuai kebutuhan. Admin memiliki akses penuh, sementara Satpam dan Warga memiliki akses terbatas.</p>
                </div>
            </div>

            <div className={styles.filterContainer}>
                <label className={styles.filterLabel}><FaFilter /> Filter Peran:</label>
                <select
                    className={styles.filterSelect}
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value as any)}
                >
                    <option value="all">Semua Peran</option>
                    <option value="admin">Admin</option>
                    <option value="satpam">Satpam</option>
                    <option value="warga">Warga</option>
                </select>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Nama</th>
                            <th>Email</th>
                            <th>Peran Saat Ini</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user.id}>
                                <td data-label="Nama">{user.nama || '(Belum Diatur)'}</td>
                                <td data-label="Email">{user.email}</td>
                                <td data-label="Peran">
                                    <select
                                        value={user.role || 'warga'}
                                        onChange={(e) => onUpdateUser(user.id, e.target.value, user.verified)}
                                        className={styles.select}
                                    >
                                        <option value="warga">Warga</option>
                                        <option value="satpam">Satpam</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </td>
                                <td data-label="Aksi">
                                    <div className={styles.actionCell}>
                                        <button className={styles.editBtn} onClick={() => handleOpenEditModal(user)} title="Edit Detail">
                                            <FaEdit />
                                        </button>
                                        <button className={styles.deleteBtn} onClick={() => onDeleteUser(user.id)} title="Hapus Pengguna">
                                            <FaTrash />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                            <tr><td colSpan={4} style={{ textAlign: 'center' }}>Tidak ada data pengguna yang sesuai filter.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Tambah/Edit */}
            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h3>{editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h3>
                            <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}><FaTimes /></button>
                        </div>
                        <form className={styles.modalForm} onSubmit={handleSubmit}>
                            {!editingUser && (
                                <p style={{ fontSize: '0.8rem', color: '#6b7280', backgroundColor: '#f9fafb', padding: '0.5rem', borderRadius: '0.25rem', marginBottom: '0.5rem' }}>
                                    <strong>Info:</strong> Akun login akan dibuat otomatis dengan password default: <code>wargakoba123</code>
                                </p>
                            )}
                            <div className={styles.formGroup}>
                                <label>Nama Lengkap</label>
                                <input
                                    type="text"
                                    value={formData.nama}
                                    onChange={e => setFormData({ ...formData, nama: e.target.value })}
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Peran</label>
                                <select
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="warga">Warga</option>
                                    <option value="satpam">Satpam</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>No. KK (Opsional)</label>
                                <input
                                    type="text"
                                    value={formData.noKK}
                                    onChange={e => setFormData({ ...formData, noKK: e.target.value })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Alamat Blok (Opsional)</label>
                                <input
                                    type="text"
                                    value={formData.alamatBlok}
                                    onChange={e => setFormData({ ...formData, alamatBlok: e.target.value })}
                                />
                            </div>
                            <div className={styles.modalFooter}>
                                <button type="button" className={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>Batal</button>
                                <button type="submit" className={styles.submitBtn}>
                                    {editingUser ? 'Simpan Perubahan' : 'Tambah Pengguna'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
}
