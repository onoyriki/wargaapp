
import { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCreateUserWithEmailAndPassword } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import styles from '../styles/Login.module.css'; // Reusing the login styles
import { FaUser, FaEnvelope, FaLock, FaMapMarkerAlt } from 'react-icons/fa';

export default function Register() {
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [alamatBlok, setAlamatBlok] = useState('');
  const [createUserWithEmailAndPassword, user, loading, error] = useCreateUserWithEmailAndPassword(auth);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newUser = await createUserWithEmailAndPassword(email, password);
      if (newUser) {
        await setDoc(doc(db, 'users', newUser.user.uid), {
          nama: nama,
          email: newUser.user.email,
          role: 'warga',
          verified: false,
          alamatBlok: alamatBlok,
          createdAt: new Date(),
        });
        router.push('/menunggu-verifikasi');
      }
    } catch (err) {
      console.error("Error during registration or Firestore write:", err);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <Head>
        <title>Daftar Akun - WargaKoba</title>
      </Head>

      <div className={styles.visualSide}>
        <h1>Bergabung dengan Komunitas WargaKoba</h1>
        <p>Daftarkan diri Anda untuk menjadi bagian dari sistem data warga yang modern dan terintegrasi.</p>
      </div>

      <div className={styles.formSide}>
        <div className={styles.formWrapper}>
          <div className={styles.header}>
            <h2>Buat Akun Baru</h2>
            <p>Isi formulir di bawah ini untuk mendaftar.</p>
          </div>
          <form onSubmit={handleRegister} className={styles.form}>
            
            <div className={styles.inputGroup}>
              <FaUser className={styles.inputIcon} />
              <input
                id="nama"
                className={styles.input}
                type="text"
                placeholder="Nama Lengkap"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
              />
            </div>

            <div className={styles.inputGroup}>
              <FaEnvelope className={styles.inputIcon} />
              <input
                id="email"
                className={styles.input}
                type="email"
                placeholder="Alamat Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className={styles.inputGroup}>
              <FaLock className={styles.inputIcon} />
              <input
                id="password"
                className={styles.input}
                type="password"
                placeholder="Kata Sandi (min. 6 karakter)"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <div className={styles.inputGroup}>
              <FaMapMarkerAlt className={styles.inputIcon} />
              <input
                id="alamatBlok"
                className={styles.input}
                type="text"
                placeholder="Blok Rumah (Contoh: B12A)"
                required
                value={alamatBlok}
                maxLength={4}
                onChange={(e) => setAlamatBlok(e.target.value.toUpperCase())}
              />
            </div>

            {error && <p className={styles.error}>{`Error: ${error.code.replace('auth/', '').replace(/-/g, ' ')}`}</p>}
            
            <button className={styles.button} type="submit" disabled={loading}>
              {loading ? 'Mendaftarkan...' : 'Buat Akun'}
            </button>
          </form>
          <div className={styles.footer}>
            <p>Sudah punya akun? <Link href="/">Login di sini</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
