
import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/hooks';
import { withAuth } from '../../components/withAuth';
import Layout from '../../components/Layout';
import styles from '../../styles/Form.module.css';
import { FaSave, FaExchangeAlt } from 'react-icons/fa';

function SerahTerimaPage() {
  const { user, userData } = useAuth(); // Destructure user object
  const router = useRouter();

  const [shift, setShift] = useState('Pagi');
  const [kondisi, setKondisi] = useState('Aman Terkendali');
  const [kejadian, setKejadian] = useState('');
  const [inventaris, setInventaris] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!user || !userData) { // Ensure user and userData are loaded
      setError('Gagal memvalidasi pengguna. Silakan login kembali.');
      setLoading(false);
      return;
    }

    try {
      await addDoc(collection(db, 'serah_terima'), {
        shift,
        kondisi,
        kejadian: kejadian || 'Tidak ada kejadian khusus',
        inventaris: inventaris || 'Lengkap sesuai daftar',
        satpamName: userData.nama || userData.email,
        satpamId: user.uid, // Correctly use user.uid
        createdAt: serverTimestamp(),
      });

      setSuccess('Laporan serah terima berhasil dikirim! Anda akan dialihkan ke dashboard.');
      setTimeout(() => router.push('/dashboard'), 3000);

      // Reset form
      setShift('Pagi');
      setKondisi('Aman Terkendali');
      setKejadian('');
      setInventaris('');

    } catch (err) {
      console.error("Error submitting report:", err);
      setError('Gagal mengirim laporan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>Serah Terima Shift</title>
      </Head>
      <div className={styles.formContainer}>
        <form onSubmit={handleSubmit} className={styles.formBox}>
          <h1><FaExchangeAlt style={{ marginRight: '10px' }} />Formulir Serah Terima Shift</h1>
          <p>Lengkapi formulir di bawah untuk mendokumentasikan serah terima shift Anda.</p>

          {error && <p className={styles.errorMessage}>{error}</p>}
          {success && <p className={styles.successMessage}>{success}</p>}

          <div className={styles.inputGroup}>
            <label htmlFor="shift">Shift</label>
            <select id="shift" value={shift} onChange={(e) => setShift(e.target.value)} required>
              <option value="Pagi">Pagi (08:00 - 20:00)</option>
              <option value="Malam">Malam (20:00 - 08:00)</option>
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="kondisi">Kondisi Keamanan</label>
            <select id="kondisi" value={kondisi} onChange={(e) => setKondisi(e.target.value)} required>
              <option value="Aman Terkendali">Aman Terkendali</option>
              <option value="Waspada">Waspada</option>
              <option value="Darurat">Darurat</option>
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="kejadian">Laporan Kejadian Khusus (jika ada)</label>
            <textarea
              id="kejadian"
              rows={4}
              value={kejadian}
              onChange={(e) => setKejadian(e.target.value)}
              placeholder="Contoh: Ditemukan gerbang blok B tidak terkunci pada pukul 02:30."
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="inventaris">Pemeriksaan & Serah Terima Inventaris</label>
            <textarea
              id="inventaris"
              rows={3}
              value={inventaris}
              onChange={(e) => setInventaris(e.target.value)}
              placeholder="Contoh: HT, senter, dan kunci gerbang lengkap."
            />
          </div>

          <button type="submit" disabled={loading} className={styles.submitButton}>
            <FaSave style={{ marginRight: '8px' }} />
            {loading ? 'Mengirim...' : 'Kirim Laporan'}
          </button>
        </form>
      </div>
    </Layout>
  );
}

export default withAuth(SerahTerimaPage, ['satpam', 'admin']);
