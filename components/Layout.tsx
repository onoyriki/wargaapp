
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
    FaChartLine, FaMoneyBillWave, FaBullhorn, FaAngleLeft, FaAngleRight,
    FaClipboardCheck, FaMapMarkedAlt, FaServer
} from 'react-icons/fa';

const navConfig = {
    admin: [
        { href: '/dashboard', label: 'Dashboard', icon: <FaTachometerAlt /> },
        { href: '/admin/verifikasi', label: 'Verifikasi Pengguna', icon: <FaUsersCog /> },
        { href: '/admin/kelola-pengumuman', label: 'Kelola Pengumuman', icon: <FaBullhorn /> },
        { href: '/data-warga', label: 'Data Warga', icon: <FaUsers /> },
        { href: '/admin/kelola-iuran', label: 'Kelola Iuran', icon: <FaFileInvoiceDollar /> },
        { href: '/admin/kelola-patroli', label: 'Kelola Titik Patroli', icon: <FaMapMarkedAlt /> },
        { href: '/admin/laporan-keuangan', label: 'Laporan Keuangan', icon: <FaChartLine /> },
        { href: '/laporan-patroli', label: 'Laporan Patroli', icon: <FaShieldAlt /> },
        { href: '/admin/monitoring', label: 'Monitoring DB', icon: <FaServer /> },
    ],
    satpam: [
        { href: '/dashboard', label: 'Dashboard', icon: <FaTachometerAlt /> },
        { href: '/satpam/patroli', label: 'Mulai Patroli', icon: <FaClipboardCheck /> },
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

import Head from 'next/head';

interface LayoutProps {
    children: React.ReactNode;
    title?: string;
}

const Layout = ({ children, title = 'WargaKoba' }: LayoutProps) => {
    const router = useRouter();
    const [signOut] = useSignOut(auth);
    const { user, userData, loading } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

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
            <Head>
                <title>{title}</title>
            </Head>
            {isMobileMenuOpen && <div className={styles.backdrop} onClick={() => setIsMobileMenuOpen(false)}></div>}
            <aside className={`${styles.sidebar} ${isMobileMenuOpen ? styles.sidebarOpen : ''} ${isMinimized ? styles.sidebarMinimized : ''}`}>
                <div className={styles.sidebarHeader}>
                    <h2 className={isMinimized ? styles.hidden : ''}>WargaKoba</h2>
                    <div className={styles.headerButtons}>
                        <button className={styles.minimizeButton} onClick={() => setIsMinimized(!isMinimized)}>
                            {isMinimized ? <FaAngleRight /> : <FaAngleLeft />}
                        </button>
                        <button className={styles.closeButton} onClick={() => setIsMobileMenuOpen(false)}>
                            <FaTimes />
                        </button>
                    </div>
                </div>
                <nav className={styles.sidebarNav}>
                    {navItems.map((item) => (
                        <Link key={item.href} href={item.href} className={`${styles.navLink} ${isMinimized ? styles.navLinkMinimized : ''} ${router.pathname === item.href ? styles.active : ''}`}>
                            {item.icon}
                            <span className={isMinimized ? styles.hidden : ''}>{item.label}</span>
                        </Link>
                    ))}
                </nav>
                <div className={styles.sidebarFooter}>
                    <div className={`${styles.userInfo} ${isMinimized ? styles.userInfoMinimized : ''}`}>
                        {/* Updated display format */}
                        <span className={isMinimized ? styles.hidden : ''}>
                            {userData?.nama || user?.email}
                            {userData?.role && ` (${capitalize(userData.role)})`}
                        </span>
                    </div>
                    <button onClick={handleLogout} className={`${styles.logoutButton} ${isMinimized ? styles.logoutButtonMinimized : ''}`}>
                        <FaSignOutAlt />
                        <span className={isMinimized ? styles.hidden : ''}>Logout</span>
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
