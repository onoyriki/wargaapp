import { useState } from 'react';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import styles from '../styles/Auth.module.css';
import Link from 'next/link';
import Head from 'next/head';

const LupaPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('Silakan masukkan alamat email Anda.');
      return;
    }

    setLoading(true);
    const auth = getAuth();
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Email pengaturan ulang kata sandi telah dikirim. Silakan periksa kotak masuk Anda.');
    } catch (err: any) {
      setError(err.message.replace('Firebase: ', '').replace(/\(auth\/.*\)/, ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.authContainer}>
      <Head>
        <title>Lupa Password - WargaKoba</title>
      </Head>
      <section className={styles.authBox}>
        <h1 className={styles.title}>Lupa Password</h1>
        <p className={styles.subtitle}>
          Masukkan email Anda untuk menerima tautan reset.
        </p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contoh@email.com"
              className={styles.input}
              required
            />
          </div>
          {message && <p className={styles.successMessage}>{message}</p>}
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'Mengirim...' : 'Kirim Email Reset'}
          </button>
        </form>
        <div className={styles.link}>
          <Link href="/" legacyBehavior>
            <a>Kembali ke Login</a>
          </Link>
        </div>
      </section>
    </main>
  );
};

export default LupaPassword;
