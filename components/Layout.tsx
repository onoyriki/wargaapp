
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSignOut } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../lib/hooks';
import styles from './Layout.module.css';
import { 
    FaTachometerAlt, FaUsers, FaSignOutAlt, FaBars, FaTimes, 
    FaUsersCog, FaShieldAlt, FaUserCircle, FaFileInvoiceDollar, 
    FaChartLine, FaMoneyBillWave 
} from 'react-icons/fa';

const navConfig = {
    admin: [
        { href: '/dashboard', label: 'Dashboard', icon: <FaTachometerAlt /> },
        { href: '/admin/verifikasi', label: 'Verifikasi Pengguna', icon: <FaUsersCog /> },
        { href: '/data-warga', label: 'Data Warga', icon: <FaUsers /> },
        { href: '/admin/kelola-iuran', label: 'Kelola Iuran', icon: <FaFileInvoiceDollar /> },
        { href: '/admin/laporan-keuangan', label: 'Laporan Keuangan', icon: <FaChartLine /> },
        { href: '/laporan-patroli', label: 'Laporan Patroli', icon: <FaShieldAlt /> },
    ],
    satpam: [
        { href: '/dashboard', label: 'Dashboard', icon: <FaTachometerAlt /> },
        { href: '/data-warga', label: 'Data Warga', icon: <FaUsers /> },
        { href: '/laporan-patroli', label: 'Laporan Patroli', icon: <FaShieldAlt /> },
    ],
    warga: [
        { href: '/dashboard', label: 'Dashboard', icon: <FaTachometerAlt /> },
        { href: '/profil', label: 'Profil Saya', icon: <FaUserCircle /> },
        { href: '/iuran-saya', label: 'Iuran Saya', icon: <FaMoneyBillWave /> },
        { href: '/data-warga', label: 'Data Keluarga', icon: <FaUsers /> },
        { href: '/laporan-patroli', label: 'Laporan Patroli', icon: <FaShieldAlt /> },
    ],
};

const Layout = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const [signOut] = useSignOut(auth);
    const { user, userData, loading } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [router.pathname]);

    const handleLogout = async () => {
        await signOut();
        router.push('/');
    };

    const role = userData?.role;
    const navItems = role ? navConfig[role as keyof typeof navConfig] || [] : [];

    // Capitalize first letter of a string
    const capitalize = (s: string) => s && s.charAt(0).toUpperCase() + s.slice(1);

    if (loading) {
        return <div className={styles.loadingContainer}><div className={styles.loadingSpinner}></div></div>; 
    }

    if (!user) {
        return null; 
    }

    return (
        <div className={styles.layoutContainer}>
            {isMobileMenuOpen && <div className={styles.backdrop} onClick={() => setIsMobileMenuOpen(false)}></div>}
            <aside className={`${styles.sidebar} ${isMobileMenuOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.sidebarHeader}>
                    <h2>WargaKoba</h2>
                    <button className={styles.closeButton} onClick={() => setIsMobileMenuOpen(false)}>
                        <FaTimes />
                    </button>
                </div>
                <nav className={styles.sidebarNav}>
                    {navItems.map((item) => (
                        <Link key={item.href} href={item.href} className={`${styles.navLink} ${router.pathname === item.href ? styles.active : ''}`}>
                            {item.icon}
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>
                <div className={styles.sidebarFooter}>
                     <div className={styles.userInfo}>
                        {/* Updated display format */}
                        <span>
                            {userData?.nama || user?.email}
                            {userData?.role && ` (${capitalize(userData.role)})`}
                        </span>
                    </div>
                    <button onClick={handleLogout} className={styles.logoutButton}>
                        <FaSignOutAlt />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
            <main className={styles.mainContent}>
                <header className={styles.mainHeader}>
                    <button className={styles.menuButton} onClick={() => setIsMobileMenuOpen(true)}>
                        <FaBars />
                        <span>Menu</span>
                    </button>
                </header>
                {children}
            </main>
        </div>
    );
};

export default Layout;
