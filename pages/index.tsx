
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSignInWithEmailAndPassword } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import styles from '../styles/Login.module.css';
import { FaEnvelope, FaLock, FaImage, FaTimes } from 'react-icons/fa';

interface DetailItem {
  id: string;
  judul: string;
  isi: string;
  penulis: string;
  createdAt: any;
  images?: string[];
  type: 'pengumuman' | 'iklan';
}

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signInWithEmailAndPassword, user, loading, error] = useSignInWithEmailAndPassword(auth);
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState<DetailItem | null>(null);

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

      <div className={styles.topRow}>
        <div className={styles.visualSide}>
          <div className={styles.visualContent}>
            <div>
              <h1>Selamat Datang di Cluster Koba Village Purwakarta</h1>
              <p>Solusi digital terintegrasi untuk manajemen data warga yang efisien, modern, dan aman.</p>
            </div>

            {/* Pengumuman dan Iklan Terbaru (Compact) */}
            <div className={styles.announcementsSection}>
              <div className={styles.announcementsGrid}>
                {pengumumanCollection?.docs.map(doc => {
                  const data = doc.data();
                  return (
                    <div
                      key={doc.id}
                      className={styles.announcementItem}
                      onClick={() => setSelectedItem({
                        id: doc.id,
                        judul: data.judul,
                        isi: data.isi,
                        penulis: data.penulis,
                        createdAt: data.createdAt,
                        images: data.images,
                        type: 'pengumuman'
                      })}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className={styles.thumbnailWrapper}>
                        {data.images && data.images.length > 0 ? (
                          <img src={data.images[0]} alt={data.judul} className={styles.announcementThumbnail} />
                        ) : (
                          <div className={styles.placeholderThumbnail}><FaImage /></div>
                        )}
                      </div>
                      <div className={styles.announcementText}>
                        <h3>{data.judul}</h3>
                        <small>Pengumuman</small>
                      </div>
                    </div>
                  );
                })}
                {iklanCollection?.docs.map(doc => {
                  const data = doc.data();
                  console.log('Iklan data:', doc.id, data);
                  console.log('Iklan images:', data.images);
                  return (
                    <div
                      key={doc.id}
                      className={styles.announcementItem}
                      onClick={() => setSelectedItem({
                        id: doc.id,
                        judul: data.judul,
                        isi: data.isi,
                        penulis: data.penulis,
                        createdAt: data.createdAt,
                        images: data.images,
                        type: 'iklan'
                      })}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className={styles.thumbnailWrapper}>
                        {data.images && data.images.length > 0 ? (
                          <img src={data.images[0]} alt={data.judul} className={styles.announcementThumbnail} />
                        ) : (
                          <div className={styles.placeholderThumbnail}><FaImage /></div>
                        )}
                      </div>
                      <div className={styles.announcementText}>
                        <h3>{data.judul}</h3>
                        <small>Iklan</small>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.formSide}>
          <div className={styles.formWrapper}>
            <div className={styles.header}>
              <h2>Masuk ke Akun Anda</h2>
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
              <p>Belum punya akun? <Link href="/register" legacyBehavior><a>Daftar di sini</a></Link></p>
              <p><Link href="/lupa-password" legacyBehavior><a>Lupa Password?</a></Link></p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Detail */}
      {selectedItem && (
        <div className={styles.modalOverlay} onClick={() => setSelectedItem(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setSelectedItem(null)}>
              <FaTimes />
            </button>
            <div className={styles.modalHeader}>
              <h2>{selectedItem.judul}</h2>
              <span className={styles.modalBadge}>
                {selectedItem.type === 'pengumuman' ? 'Pengumuman' : 'Iklan'}
              </span>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalText}>{selectedItem.isi}</p>
              {selectedItem.images && selectedItem.images.length > 0 && (
                <div className={styles.modalImages}>
                  {selectedItem.images.map((img, idx) => (
                    <img key={idx} src={img} alt={`${selectedItem.judul} ${idx + 1}`} />
                  ))}
                </div>
              )}
              <div className={styles.modalFooter}>
                <small>
                  Oleh: {selectedItem.penulis} | {selectedItem.createdAt?.toDate().toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </small>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
