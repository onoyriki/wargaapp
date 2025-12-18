
import { useState } from 'react';
import Head from 'next/head';
import { withAuth } from '../../components/withAuth';
import Layout from '../../components/Layout';
import LaporanSerahTerima from '../../components/LaporanSerahTerima';
import LaporanBukuTamu from '../../components/LaporanBukuTamu';
import styles from '../../styles/LaporanKeamanan.module.css';
import { FaClipboardList, FaBook } from 'react-icons/fa';

type View = 'serahTerima' | 'bukuTamu';

function LaporanKeamananPage() {
  const [activeView, setActiveView] = useState<View>('serahTerima');

  return (
    <Layout>
      <Head>
        <title>Laporan Keamanan</title>
      </Head>
      <div className={styles.container}>
        <div className={styles.tabContainer}>
          <button 
            className={`${styles.tabButton} ${activeView === 'serahTerima' ? styles.active : ''}`}
            onClick={() => setActiveView('serahTerima')}
          >
            <FaClipboardList />
            Laporan Serah Terima
          </button>
          <button 
            className={`${styles.tabButton} ${activeView === 'bukuTamu' ? styles.active : ''}`}
            onClick={() => setActiveView('bukuTamu')}
          >
            <FaBook />
            Laporan Buku Tamu
          </button>
        </div>

        <div className={styles.contentContainer}>
          {activeView === 'serahTerima' && <LaporanSerahTerima />}
          {activeView === 'bukuTamu' && <LaporanBukuTamu />}
        </div>
      </div>
    </Layout>
  );
}

export default withAuth(LaporanKeamananPage, ['admin']);
