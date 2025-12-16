
import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/hooks';
import { ComponentType, useEffect } from 'react';

// Overload the function signature
export function withAuth<P extends object>(WrappedComponent: ComponentType<P>): (props: P) => React.JSX.Element | null;
export function withAuth<P extends object>(WrappedComponent: ComponentType<P>, allowedRoles: string[]): (props: P) => React.JSX.Element | null;

export function withAuth<P extends object>(WrappedComponent: ComponentType<P>, allowedRoles?: string[]) {
  const WithAuthComponent = (props: P) => {
    const { user, userData, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (loading) return; // Tunggu hingga selesai loading

      const isAuthPage = router.pathname === '/' || router.pathname === '/register';
      const isVerificationPage = router.pathname === '/menunggu-verifikasi';

      if (!user) {
        if (!isAuthPage) {
          router.replace('/');
        }
        return;
      }
      
      // Jika user sudah login
      if (userData) {
        if (!userData.verified) {
          if (!isVerificationPage) {
            router.replace('/menunggu-verifikasi');
          }
          return;
        }

        // Jika user sudah terverifikasi
        // 1. Cek peran (otorisasi)
        if (allowedRoles && allowedRoles.length > 0 && userData.role && !allowedRoles.includes(userData.role)) {
          // Jika peran tidak diizinkan, redirect ke dashboard
          alert("Anda tidak memiliki hak akses untuk halaman ini."); // Opsional: beri notifikasi
          router.replace('/dashboard');
          return;
        }

        // 2. Jika warga belum lengkapi profil, redirect ke profil
        if (userData.role === 'warga' && !userData.noKK && router.pathname !== '/profil') {
          router.replace('/profil');
          return;
        }

        // 3. Redirect dari halaman otentikasi jika sudah login & verified
        if (isAuthPage || isVerificationPage) {
          router.replace('/dashboard');
        }
      }

    }, [user, userData, loading, router]);

    // Tampilkan loading spinner jika masih dalam proses otentikasi/otorisasi
    if (loading) {
      return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
    }

    // Jika sudah tidak loading tapi user belum ada, arahkan ke login
    if (!user) {
      return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Redirecting...</div>;
    }

    // Jika user ada tapi userData tidak tersedia, jangan stuck di loading.
    // Ini biasanya berarti dokumen users/{uid} tidak ada atau tidak bisa dibaca (rules/permission).
    if (!userData) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: 12 }}>
          <div>Gagal memuat data pengguna. Pastikan akun Anda sudah terdaftar di database dan memiliki akses.</div>
          <button onClick={() => router.replace('/')} style={{ padding: '10px 14px', cursor: 'pointer' }}>Kembali ke Login</button>
        </div>
      );
    }

    // Jika semua pengecekan lolos, render komponen
    // Namun, cegah rendering prematur yang bisa menyebabkan "flash of unauthenticated content"
    if(allowedRoles && allowedRoles.length > 0 && userData.role && !allowedRoles.includes(userData.role)){
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Redirecting...</div>;
    }
    if(!userData.verified && router.pathname !== '/menunggu-verifikasi'){
       return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Redirecting...</div>;
    }

    return <WrappedComponent {...props} />;
  };

  WithAuthComponent.displayName = `WithAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithAuthComponent;
};
