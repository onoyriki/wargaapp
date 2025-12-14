
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSignOut } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../lib/hooks';
import { withAuth } from '../components/withAuth';
import styles from '../styles/Verification.module.css';

function WaitingForVerificationPage() {
  const { user } = useAuth();
  const [signOut] = useSignOut(auth);
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <div className={styles.verificationContainer}>
      <Head>
        <title>Menunggu Verifikasi</title>
        {/* Preconnect to Google Fonts for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>
      <div className={styles.card}>
        <div className={styles.iconContainer}>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" stroke="#8ec5fc" strokeWidth="1.5" strokeOpacity="0.5"/>
            <path d="M12 7V12L15 13.5" stroke="url(#paint0_linear_14_134)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <defs>
              <linearGradient id="paint0_linear_14_134" x1="12" y1="7" x2="15" y2="13.5" gradientUnits="userSpaceOnUse">
                <stop stopColor="#667eea"/>
                <stop offset="1" stopColor="#764ba2"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1 className={styles.title}>Akun Anda Sedang Ditinjau</h1>
        <p className={styles.message}>
          Terima kasih telah mendaftar, <strong>{user?.email}</strong>. Akun Anda saat ini sedang menunggu verifikasi oleh administrator.
        </p>
        <p className={styles.instructions}>
          Anda akan menerima notifikasi setelah akun Anda disetujui. Silakan periksa kembali nanti.
        </p>
        <button onClick={handleLogout} className={styles.logoutButton}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default withAuth(WaitingForVerificationPage);
