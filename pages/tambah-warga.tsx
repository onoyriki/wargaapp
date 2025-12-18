
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { collection, addDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/hooks';
import Layout from '../components/Layout';
import { withAuth } from '../components/withAuth';
import styles from '../styles/Form.module.css';
import {
    FaUser, FaMapMarkedAlt, FaIdCard, FaVenusMars, 
    FaBirthdayCake, FaUserFriends, FaBriefcase, FaHandHoldingHeart, FaUsers, FaEnvelope
} from 'react-icons/fa';

function TambahWarga() {
    const { userData, loading: authLoading } = useAuth();
    const router = useRouter();
    const isWarga = userData?.role === 'warga';

    useEffect(() => {
        if (!authLoading && isWarga && (!userData?.noKK || !userData?.alamatBlok)) {
            alert('Harap lengkapi profil Anda (termasuk No. KK dan Alamat) dahulu.');
            router.push('/profil');
        }
    }, [userData, authLoading, isWarga, router]);

    const [nama, setNama] = useState('');
    const [nik, setNik] = useState('');
    const [jenisKelamin, setJenisKelamin] = useState('Laki-laki');
    const [tanggalLahir, setTanggalLahir] = useState('');
    const [pekerjaan, setPekerjaan] = useState('');
    const [statusPerkawinan, setStatusPerkawinan] = useState('Belum Kawin');
    const [statusHubungan, setStatusHubungan] = useState(isWarga ? 'Anak' : 'Kepala Keluarga');

    // Admin-only state
    const [email, setEmail] = useState('');
    const [noKK, setNoKK] = useState('');
    const [alamatBlok, setAlamatBlok] = useState('');

    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        // Comprehensive validation for all fields
        const requiredFields: { [key: string]: string } = {
            nama,
            nik,
            jenisKelamin,
            tanggalLahir,
            pekerjaan,
            statusPerkawinan,
            statusHubungan
        };

        // Admin-specific fields
        if (!isWarga) {
            requiredFields.noKK = noKK;
            requiredFields.email = email;
            requiredFields.alamatBlok = alamatBlok;
        }

        const missingFields = Object.entries(requiredFields)
            .filter(([_, value]) => !value)
            .map(([key]) => {
                // Prettify field names for the error message
                switch (key) {
                    case 'nama': return 'Nama Lengkap';
                    case 'nik': return 'NIK';
                    case 'jenisKelamin': return 'Jenis Kelamin';
                    case 'tanggalLahir': return 'Tanggal Lahir';
                    case 'pekerjaan': return 'Pekerjaan';
                    case 'statusPerkawinan': return 'Status Perkawinan';
                    case 'statusHubungan': return 'Status Hubungan';
                    case 'noKK': return 'Nomor Kartu Keluarga';
                    case 'email': return 'Email Pengguna';
                    case 'alamatBlok': return 'Alamat Blok';
                    default: return key;
                }
            });

        if (missingFields.length > 0) {
            setError(`Semua field wajib diisi. Field yang kosong: ${missingFields.join(', ')}.`);
            setIsSubmitting(false);
            return;
        }


        // Check if NIK is unique
        const nikQuery = query(collection(db, 'warga'), where('nik', '==', nik));
        const nikSnapshot = await getDocs(nikQuery);
        if (!nikSnapshot.empty) {
            setError('NIK sudah terdaftar. Harap gunakan NIK yang berbeda.');
            setIsSubmitting(false);
            return;
        }

        try {
            let dataToAdd: any;

            if (isWarga) {
                if (!userData?.noKK || !userData?.alamatBlok) {
                    setError('Profil Kepala Keluarga tidak lengkap. Harap perbarui profil Anda.');
                    setIsSubmitting(false);
                    return;
                }
                dataToAdd = {
                    nama, nik, jenisKelamin, pekerjaan, statusPerkawinan, statusHubungan,
                    noKK: userData.noKK,
                    alamatBlok: userData.alamatBlok,
                    email: '', // Anggota keluarga tidak punya login sendiri
                    createdAt: Timestamp.now(),
                };
            } else { // Admin
                dataToAdd = {
                    nama, nik, jenisKelamin, pekerjaan, statusPerkawinan,
                    statusHubungan: 'Kepala Keluarga',
                    noKK, alamatBlok, email,
                    createdAt: Timestamp.now(),
                };
            }
            
            dataToAdd.tanggalLahir = Timestamp.fromDate(new Date(tanggalLahir));

            await addDoc(collection(db, 'warga'), dataToAdd);
            router.push('/data-warga');
        } catch (err) {
            console.error("Error adding document: ", err);
            setError('Gagal menambahkan data. Pastikan NIK unik.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (authLoading || (isWarga && !userData?.noKK)) {
        return <Layout><div>Memeriksa profil...</div></Layout>
    }

    return (
        <Layout>
            <Head><title>{isWarga ? 'Tambah Anggota Keluarga' : 'Tambah Warga Baru'} - WargaKoba</title></Head>
            <div className={styles.container}>
                <div className={styles.formContainer}>
                    <header className={styles.header}>
                        <h1>{isWarga ? 'Formulir Anggota Keluarga' : 'Formulir Warga Baru'}</h1>
                        <p>{isWarga ? `Menambahkan anggota ke KK No. ${userData?.noKK}` : 'Isi detail lengkap untuk membuat Kepala Keluarga baru.'}</p>
                    </header>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        {error && <p className={styles.errorBanner}>{error}</p>}
                        <div className={styles.inputGrid}>
                            {!isWarga && (
                                <>
                                    <div className={styles.inputGroup}><label htmlFor="noKK">Nomor Kartu Keluarga</label><div className={styles.inputWrapper}><FaUsers className={styles.inputIcon} /><input id="noKK" type="text" value={noKK} onChange={(e) => setNoKK(e.target.value)} required /></div></div>
                                    <div className={styles.inputGroup}><label htmlFor="email">Email Pengguna</label><div className={styles.inputWrapper}><FaEnvelope className={styles.inputIcon} /><input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div></div>
                                    <div className={styles.inputGroup}><label htmlFor="alamatBlok">Alamat Blok (Contoh: A1, B2, T8)</label><div className={styles.inputWrapper}><FaMapMarkedAlt className={styles.inputIcon} /><input id="alamatBlok" type="text" value={alamatBlok} onChange={(e) => setAlamatBlok(e.target.value.toUpperCase())} required /></div></div>
                                </> 
                            )}
                            <div className={styles.inputGroup}><label htmlFor="nama">Nama Lengkap</label><div className={styles.inputWrapper}><FaUser className={styles.inputIcon} /><input id="nama" type="text" value={nama} onChange={(e) => setNama(e.target.value)} required /></div></div>
                            <div className={styles.inputGroup}><label htmlFor="nik">NIK</label><div className={styles.inputWrapper}><FaIdCard className={styles.inputIcon} /><input id="nik" type="text" value={nik} onChange={(e) => setNik(e.target.value)} required /></div></div>
                            <div className={styles.inputGroup}><label htmlFor="jenisKelamin">Jenis Kelamin</label><div className={styles.inputWrapper}><FaVenusMars className={styles.inputIcon} /><select id="jenisKelamin" value={jenisKelamin} onChange={(e) => setJenisKelamin(e.target.value)} required><option>Laki-laki</option><option>Perempuan</option></select></div></div>
                            <div className={styles.inputGroup}><label htmlFor="tanggalLahir">Tanggal Lahir</label><div className={styles.inputWrapper}><FaBirthdayCake className={styles.inputIcon} /><input id="tanggalLahir" type="date" value={tanggalLahir} onChange={(e) => setTanggalLahir(e.target.value)} required /></div></div>
                            <div className={styles.inputGroup}><label htmlFor="statusHubungan">Status Hubungan</label><div className={styles.inputWrapper}><FaUserFriends className={styles.inputIcon} /><select id="statusHubungan" value={statusHubungan} onChange={(e) => setStatusHubungan(e.target.value)} required>{!isWarga && <option>Kepala Keluarga</option>}<option>Istri</option><option>Anak</option><option>Lainnya</option></select></div></div>
                            <div className={styles.inputGroup}><label htmlFor="pekerjaan">Pekerjaan</label><div className={styles.inputWrapper}><FaBriefcase className={styles.inputIcon} /><input id="pekerjaan" type="text" value={pekerjaan} onChange={(e) => setPekerjaan(e.target.value)} required /></div></div>
                            <div className={styles.inputGroup}><label htmlFor="statusPerkawinan">Status Perkawinan</label><div className={styles.inputWrapper}><FaHandHoldingHeart className={styles.inputIcon} /><select id="statusPerkawinan" value={statusPerkawinan} onChange={(e) => setStatusPerkawinan(e.target.value)} required><option>Belum Kawin</option><option>Kawin</option><option>Cerai Hidup</option><option>Cerai Mati</option></select></div></div>
                        </div>
                        <div className={styles.buttonGroup}>
                            <button type="button" className={styles.cancelButton} onClick={() => router.back()} disabled={isSubmitting}>Batal</button>
                            <button type="submit" className={styles.submitButton} disabled={isSubmitting}>{isSubmitting ? 'Menyimpan...' : 'Simpan Data'}</button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}

export default withAuth(TambahWarga, ['admin', 'warga']);
