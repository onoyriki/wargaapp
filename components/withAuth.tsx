
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
    const isBrowser = typeof window !== 'undefined';

    console.log('[withAuth] Render - loading:', loading, 'path:', router.pathname, 'user:', !!user, 'userData:', !!userData);

    useEffect(() => {
      // We only run the redirection logic on the client
      if (loading || !isBrowser) {
        console.log('[withAuth] useEffect - waiting (loading or !browser)');
        return;
      }
      console.log('[withAuth] useEffect - checking access');

      const isAuthPage = router.pathname === '/' || router.pathname === '/register';
      const isVerificationPage = router.pathname === '/menunggu-verifikasi';

      if (!user) {
        if (router.pathname !== '/' && router.pathname !== '/register' && router.pathname !== '/lupa-password') {
          console.log('[withAuth] No user found, redirecting to login');
          router.replace('/');
        }
        return;
      }

      if (userData) {
        console.log('[withAuth] Auth Check - role:', userData.role, 'verified:', userData.verified, 'noKK:', !!userData.noKK);
        if (!userData.verified) {
          if (!isVerificationPage) {
            router.replace('/menunggu-verifikasi');
          }
          return;
        }

        if (allowedRoles && allowedRoles.length > 0 && userData.role && !allowedRoles.includes(userData.role)) {
          alert("Anda tidak memiliki hak akses untuk halaman ini.");
          router.replace('/dashboard');
          return;
        }

        // Redirect warga without No KK to profile, but only if they are not already there
        // AND handle potential enrichment delay.
        if (userData.role === 'warga' && !userData.noKK && router.pathname !== '/profil') {
          // Double check: if noKK is missing, is it maybe because enrichment hasn't happened?
          // (loading handles this, but let's be safe)
          console.log('[withAuth] Redirect check for warga - noKK:', !!userData.noKK);
          router.replace('/profil');
          return;
        }

        if (isAuthPage || isVerificationPage) {
          router.replace('/dashboard');
        }
      }

    }, [user, userData, loading, router, isBrowser]);

    // Render a consistent loading state on the server and initial client render
    if (loading || !isBrowser) {
      return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading Application...</div>;
    }

    // After loading, if user is not logged in, wait for redirect
    if (!user) {
      return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Redirecting to login...</div>;
    }

    // If user is logged in, but data is not yet available (or failed)
    if (!userData) {
      // This can happen if the user document in Firestore is missing.
      // The useEffect will handle redirection if needed (e.g., to /profil)
      return (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: 12 }}>
          <div>Loading user data...</div>
        </div>
      );
    }

    // Prevent rendering child component if authorization check fails, wait for redirect
    if (allowedRoles && allowedRoles.length > 0 && userData.role && !allowedRoles.includes(userData.role)) {
      return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Redirecting to dashboard...</div>;
    }

    // Prevent rendering if user is not verified, wait for redirect
    if (!userData.verified && router.pathname !== '/menunggu-verifikasi') {
      return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Redirecting to verification...</div>;
    }

    // If all checks pass, render the wrapped component
    return <WrappedComponent {...props} />;
  };

  WithAuthComponent.displayName = `WithAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithAuthComponent;
};
