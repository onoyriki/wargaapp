
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSignInWithEmailAndPassword } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import styles from '../styles/Login.module.css';
import { FaEnvelope, FaLock } from 'react-icons/fa';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signInWithEmailAndPassword, user, loading, error] = useSignInWithEmailAndPassword(auth);
  const router = useRouter();

  const [iklanCollection] = useCollection(query(collection(db, 'iklan'), orderBy('createdAt', 'desc'), limit(3)));
  const [pengumumanCollection] = useCollection(query(collection(db, 'pengumuman'), orderBy('createdAt', 'desc'), limit(3)));

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    signInWithEmailAndPassword(email, password);
  };


  return (
    <div className={styles.pageContainer}>
      <Head>
        <title>Login - Cluster Koba Village Purwakarta</title>
      </Head>

      <div className={styles.visualSide}>
        <h1>Selamat Datang di Cluster Koba Village Purwakarta</h1>
        <p>Solusi digital terintegrasi untuk manajemen data warga yang efisien, modern, dan aman.</p>
      </div>

      <div className={styles.formSide}>
        <div className={styles.formWrapper}>
          <div className={styles.header}>
            <h2>Masuk ke Akun Anda</h2>
            <p>Silakan masukkan kredensial Anda untuk melanjutkan.</p>
          </div>
          <form className={styles.form} onSubmit={handleLogin}>
            
            <div className={styles.inputGroup}>
              <FaEnvelope className={styles.inputIcon} />
              <input
                id="email"
                className={styles.input}
                type="email"
                placeholder="Email"
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
                placeholder="Kata Sandi"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            {error && <p className={styles.error}>{`Error: ${error.code.replace('auth/', '').replace(/-/g, ' ')}`}</p>}
            
            <button className={styles.button} type="submit" disabled={loading}>
              {loading ? 'Memproses...' : 'Login'}
            </button>
          </form>

          <div className={styles.footer}>
            <p>Belum punya akun? <Link href="/register">Daftar di sini</Link></p>
          </div>
        </div>
      </div>

      {/* Pengumuman dan Iklan Terbaru */}
      <div className={styles.announcementsSection}>
        <div className={styles.announcementsGrid}>
          <div className={styles.announcementSection}>
            <h2>Pengumuman</h2>
            {pengumumanCollection?.docs.map(doc => {
              const data = doc.data();
              return (
                <div key={doc.id} className={styles.announcementItem}>
                  <h3>{data.judul}</h3>
                  <p>{data.isi}</p>
                  <small>Dari: {data.penulis}</small>
                </div>
              );
            })}
            {!pengumumanCollection && <p>Memuat pengumuman...</p>}
          </div>
          <div className={styles.announcementSection}>
            <h2>Iklan</h2>
            {iklanCollection?.docs.map(doc => {
              const data = doc.data();
              return (
                <div key={doc.id} className={styles.announcementItem}>
                  <h3>{data.judul}</h3>
                  <p>{data.deskripsi}</p>
                  <small>Diposting oleh: {data.creatorName}</small>
                </div>
              );
            })}
            {!iklanCollection && <p>Memuat iklan...</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
