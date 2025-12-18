
import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { useAuth } from '../../lib/hooks';
import { withAuth } from '../../components/withAuth';
import Layout from '../../components/Layout';
import styles from '../../styles/Form.module.css';
import { FaSave, FaCamera, FaAddressBook } from 'react-icons/fa';

function BukuTamuPage() {
  const { userData } = useAuth();
  const router = useRouter();
  
  const [namaTamu, setNamaTamu] = useState('');
  const [noKtp, setNoKtp] = useState('');
  const [noKendaraan, setNoKendaraan] = useState('');
  const [tujuan, setTujuan] = useState('');
  const [keperluan, setKeperluan] = useState('');
  const [fotoKtp, setFotoKtp] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      setFotoKtp(file);
      const previewUrl = URL.createObjectURL(file);
      setFotoPreview(previewUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!namaTamu || !noKtp || !tujuan || !keperluan) {
        setError('Mohon lengkapi semua kolom yang wajib diisi.');
        setLoading(false);
        return;
    }

    if (!fotoKtp) {
        setError('Foto KTP wajib diunggah.');
        setLoading(false);
        return;
    }

    try {
      // 1. Upload image to Firebase Storage
      const filePath = `ktp-tamu/${Date.now()}_${fotoKtp.name}`;
      const storageRef = ref(storage, filePath);
      const uploadResult = await uploadBytes(storageRef, fotoKtp);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      // 2. Save guest data to Firestore
      await addDoc(collection(db, 'buku_tamu'), {
        namaTamu,
        noKtp,
        noKendaraan: noKendaraan || 'N/A',
        tujuan,
        keperluan,
        fotoKtpUrl: downloadURL,
        satpamName: userData?.nama || userData?.email,
        satpamId: userData?.uid,
        waktuMasuk: serverTimestamp(),
      });

      setSuccess('Data tamu berhasil disimpan! Formulir telah direset.');
      
      // Reset form
      setNamaTamu('');
      setNoKtp('');
      setNoKendaraan('');
      setTujuan('');
      setKeperluan('');
      setFotoKtp(null);
      setFotoPreview(null);
      // Clear the file input visually
      const fileInput = document.getElementById('fotoKtp') as HTMLInputElement;
      if(fileInput) fileInput.value = "";

    } catch (err) {
      console.error("Error saving guest data:", err);
      setError('Gagal menyimpan data tamu. Pastikan koneksi internet Anda stabil dan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>Buku Tamu</title>
      </Head>
      <div className={styles.formContainer}>
        <form onSubmit={handleSubmit} className={styles.formBox}>
          <h1><FaAddressBook style={{ marginRight: '10px' }}/>Formulir Buku Tamu</h1>
          <p>Catat setiap tamu yang memasuki area perumahan.</p>
          
          {error && <p className={styles.errorMessage}>{error}</p>}
          {success && <p className={styles.successMessage}>{success}</p>}

          <div className={styles.inputGroup}>
            <label htmlFor="namaTamu">Nama Tamu *</label>
            <input id="namaTamu" type="text" value={namaTamu} onChange={(e) => setNamaTamu(e.target.value)} required />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="noKtp">No. KTP/Identitas *</label>
            <input id="noKtp" type="text" value={noKtp} onChange={(e) => setNoKtp(e.target.value)} required />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="fotoKtp">Upload Foto KTP * <FaCamera /></label>
            <input id="fotoKtp" type="file" accept="image/*" onChange={handleFileChange} className={styles.fileInput} required />
            {fotoPreview && <img src={fotoPreview} alt="Preview KTP" className={styles.imagePreview} />}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="noKendaraan">Nomor Kendaraan</label>
            <input id="noKendaraan" type="text" value={noKendaraan} onChange={(e) => setNoKendaraan(e.target.value)} placeholder="Contoh: B 1234 XYZ" />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="tujuan">Tujuan Kunjungan *</label>
            <input id="tujuan" type="text" value={tujuan} onChange={(e) => setTujuan(e.target.value)} placeholder="Contoh: Blok C3 No. 10" required />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="keperluan">Keperluan *</label>
            <textarea 
              id="keperluan" 
              rows={3} 
              value={keperluan} 
              onChange={(e) => setKeperluan(e.target.value)}
              placeholder="Contoh: Mengantar paket, kunjungan keluarga, dll."
              required
            />
          </div>

          <button type="submit" disabled={loading} className={styles.submitButton}>
            <FaSave style={{ marginRight: '8px' }} />
            {loading ? 'Menyimpan...' : 'Simpan Data Tamu'}
          </button>
        </form>
      </div>
    </Layout>
  );
}

export default withAuth(BukuTamuPage, ['satpam', 'admin']);
