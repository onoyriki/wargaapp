
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/hooks';
import Layout from '../components/Layout';
import { withAuth } from '../components/withAuth';
import styles from '../styles/Form.module.css';
import { FaVenusMars, FaIdCard, FaBuilding, FaBriefcase, FaHandHoldingHeart, FaSave, FaUsers, FaMapMarkedAlt, FaUser, FaPray } from 'react-icons/fa';

type WargaProfile = {
    nama: string;
    nik: string;
    noKK: string;
    pekerjaan: string;
    jenisKelamin: string; // Added field
    statusPerkawinan: string;
    statusKepemilikan: string;
    alamatBlok: string;
    agama: string;
};

function ProfilPage() {
    const { user, userData, loading: authLoading } = useAuth();
    const router = useRouter();

    const [profile, setProfile] = useState<WargaProfile>({
        nama: '', nik: '', noKK: '', pekerjaan: '', jenisKelamin: 'Laki-laki',
        statusPerkawinan: 'Belum Kawin', statusKepemilikan: 'Pemilik', alamatBlok: '',
        agama: 'Islam'
    });

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!authLoading && userData) {
            setProfile({
                nama: userData.nama || '',
                nik: userData.nik || '',
                noKK: userData.noKK || '',
                pekerjaan: userData.pekerjaan || '',
                jenisKelamin: userData.jenisKelamin || 'Laki-laki', // Added field
                statusPerkawinan: userData.statusPerkawinan || 'Belum Kawin',
                statusKepemilikan: userData.statusKepemilikan || 'Pemilik',
                alamatBlok: userData.alamatBlok || '',
                agama: userData.agama || 'Islam',
            });
            setLoading(false);
        }
    }, [userData, authLoading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setSuccess('');

        if (!profile.nama || !profile.nik || !profile.noKK || !profile.pekerjaan || !profile.alamatBlok) {
            setError('Semua field wajib diisi.');
            setIsSubmitting(false);
            return;
        }

        if (!user?.email) {
            setError('Sesi pengguna tidak valid. Silakan logout dan login kembali.');
            setIsSubmitting(false);
            return;
        }

        try {
            const dataToSave = {
                ...profile,
                email: user.email?.toLowerCase(),
                statusHubungan: 'Kepala Keluarga',
                nomorRumah: ''
            };

            if (userData?.id) {
                const wargaRef = doc(db, 'warga', userData.id);
                await updateDoc(wargaRef, dataToSave);

                // Sync to users collection for security rules
                await updateDoc(doc(db, 'users', user.uid), {
                    noKK: profile.noKK,
                    alamatBlok: profile.alamatBlok
                });

                setSuccess('Profil berhasil diperbarui!');
            } else {
                const newWargaRef = await addDoc(collection(db, 'warga'), {
                    ...dataToSave,
                    createdAt: serverTimestamp(),
                });

                // Sync to users collection for security rules
                await updateDoc(doc(db, 'users', user.uid), {
                    noKK: profile.noKK,
                    alamatBlok: profile.alamatBlok
                });

                setSuccess('Profil berhasil dibuat dan disimpan!');
            }

            setTimeout(() => router.push('/dashboard'), 2000);
        } catch (err) {
            console.error("Error saving profile: ", err);
            setError('Gagal menyimpan profil. Pastikan NIK dan No. KK unik.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading || authLoading) {
        return <Layout><div>Memuat profil...</div></Layout>;
    }

    return (
        <Layout>
            <Head><title>Profil Pengguna - WargaKoba</title></Head>
            <div className={styles.container}>
                <div className={styles.formContainer}>
                    <header className={styles.header}>
                        <h1>Lengkapi Profil Anda</h1>
                        <p>Data ini akan digunakan sebagai data Kepala Keluarga sesuai Kartu Keluarga.</p>
                    </header>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        {error && <p className={styles.errorBanner}>{error}</p>}
                        {success && <p className={styles.successBanner}>{success}</p>}

                        <div className={styles.inputGrid}>
                            <div className={styles.inputGroup}><label htmlFor="nama">Nama Lengkap</label><div className={styles.inputWrapper}><FaUser className={styles.inputIcon} /><input id="nama" type="text" value={profile.nama} onChange={(e) => setProfile({ ...profile, nama: e.target.value })} required /></div></div>
                            <div className={styles.inputGroup}><label htmlFor="nik">NIK (Nomor Induk Kependudukan)</label><div className={styles.inputWrapper}><FaIdCard className={styles.inputIcon} /><input id="nik" type="text" value={profile.nik} onChange={(e) => setProfile({ ...profile, nik: e.target.value })} required /></div></div>
                            <div className={styles.inputGroup}><label htmlFor="noKK">Nomor Kartu Keluarga</label><div className={styles.inputWrapper}><FaUsers className={styles.inputIcon} /><input id="noKK" type="text" value={profile.noKK} onChange={(e) => setProfile({ ...profile, noKK: e.target.value })} required /></div></div>
                            <div className={styles.inputGroup}><label htmlFor="alamatBlok">Alamat Blok (Contoh: A1, B2, T8)</label><div className={styles.inputWrapper}><FaMapMarkedAlt className={styles.inputIcon} /><input id="alamatBlok" type="text" value={profile.alamatBlok} onChange={(e) => setProfile({ ...profile, alamatBlok: e.target.value.toUpperCase() })} required /></div></div>
                            <div className={styles.inputGroup}><label htmlFor="pekerjaan">Pekerjaan</label><div className={styles.inputWrapper}><FaBriefcase className={styles.inputIcon} /><input id="pekerjaan" type="text" value={profile.pekerjaan} onChange={(e) => setProfile({ ...profile, pekerjaan: e.target.value })} required /></div></div>
                            {/* Added Jenis Kelamin dropdown */}
                            <div className={styles.inputGroup}><label htmlFor="jenisKelamin">Jenis Kelamin</label><div className={styles.inputWrapper}><FaVenusMars className={styles.inputIcon} /><select id="jenisKelamin" value={profile.jenisKelamin} onChange={(e) => setProfile({ ...profile, jenisKelamin: e.target.value })} required><option>Laki-laki</option><option>Perempuan</option></select></div></div>
                            <div className={styles.inputGroup}><label htmlFor="statusPerkawinan">Status Perkawinan</label><div className={styles.inputWrapper}><FaHandHoldingHeart className={styles.inputIcon} /><select id="statusPerkawinan" value={profile.statusPerkawinan} onChange={(e) => setProfile({ ...profile, statusPerkawinan: e.target.value })} required><option>Belum Kawin</option><option>Kawin</option><option>Cerai Hidup</option><option>Cerai Mati</option></select></div></div>
                            <div className={styles.inputGroup}><label htmlFor="statusKepemilikan">Status Kepemilikan Rumah</label><div className={styles.inputWrapper}><FaBuilding className={styles.inputIcon} /><select id="statusKepemilikan" value={profile.statusKepemilikan} onChange={(e) => setProfile({ ...profile, statusKepemilikan: e.target.value })} required><option>Pemilik</option><option>Sewa</option></select></div></div>
                            <div className={styles.inputGroup}><label htmlFor="agama">Agama</label><div className={styles.inputWrapper}><FaPray className={styles.inputIcon} /><select id="agama" value={profile.agama} onChange={(e) => setProfile({ ...profile, agama: e.target.value })} required><option>Islam</option><option>Kristen Protestan</option><option>Katolik</option><option>Hindu</option><option>Buddha</option><option>Khonghucu</option></select></div></div>
                        </div>

                        <div className={styles.buttonGroup}>
                            <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                                <FaSave /> {isSubmitting ? 'Menyimpan...' : 'Simpan Profil'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}

// FIX: Removed the second argument from withAuth call
export default withAuth(ProfilPage);
