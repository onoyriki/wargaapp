
import { useEffect, useState, createContext, useContext } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from 'firebase/auth';

// Expanded UserData interface to be comprehensive
interface UserData {
  id?: string;
  email: string;
  role: string;
  verified: boolean;
  nama: string;
  nik: string;
  noKK: string;
  pekerjaan: string;
  statusPerkawinan: string;
  statusKepemilikan: string;
  statusHubungan: string;
  alamatBlok: string;
  nomorRumah: string;
  createdAt: any;
  jenisKelamin?: string;
  agama?: string;
}

interface AuthContextType {
  user: User | null | undefined;
  userData: Partial<UserData> | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, userData: null, loading: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, loadingAuth] = useAuthState(auth);
  const [userData, setUserData] = useState<Partial<UserData> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[Auth Hook] Effect 1 - loadingAuth:', loadingAuth, 'user:', user?.email);
    if (loadingAuth) {
      setLoading(true);
      return;
    }

    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userDocRef, (userDoc) => {
        if (userDoc.exists()) {
          const data = userDoc.data() as any;
          console.log('[Auth Hook] User doc exists, role:', data?.role);
          setUserData({ email: user.email || '', ...data });

          // Only keep loading for warga role (will be resolved in Effect 2)
          if (data?.role !== 'warga') {
            console.log('[Auth Hook] Non-warga role:', data?.role, '- setting loading to false');
            setLoading(false);
          } else {
            console.log('[Auth Hook] Warga role found for:', user.email, '- waiting for Effect 2');
          }
        } else {
          console.log('[Auth Hook] User doc does not exist');
          setUserData(null);
          setLoading(false);
        }
      }, (error) => {
        console.error("Error fetching user data:", error);
        setUserData(null);
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      console.log('[Auth Hook] No user, setting loading to false');
      setUserData(null);
      setLoading(false);
    }
  }, [user, loadingAuth]);

  // Effect 2: Fetch corresponding 'warga' data once we have the user's email
  useEffect(() => {
    console.log('[Auth Hook] Effect 2 Start - email:', userData?.email, 'role:', userData?.role);
    if (userData?.email && userData?.role === 'warga') {
      const email = userData.email.toLowerCase().trim();
      console.log('[Auth Hook] Effect 2 - querying warga for:', email);
      const wargaQuery = query(collection(db, 'warga'), where("email", "==", email));

      const unsubscribe = onSnapshot(wargaQuery, (querySnapshot) => {
        if (!querySnapshot.empty) {
          const wargaDoc = querySnapshot.docs[0];
          const data = wargaDoc.data();
          console.log('[Auth Hook] Warga record found:', wargaDoc.id, 'noKK:', !!data.noKK);
          // Merge previous data with warga data, crucially adding the ID
          setUserData(prevData => {
            const merged = {
              ...prevData,
              ...data,
              id: wargaDoc.id,
            };
            console.log('[Auth Hook] New UserData state (role/noKK):', merged.role, !!merged.noKK);
            return merged;
          });
        } else {
          console.log('[Auth Hook] No record in warga collection for:', email);
        }
        setLoading(false);
      }, (error) => {
        console.error("Error fetching warga data:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [userData?.email, userData?.role]);

  console.log('[Auth Context State] loading:', loading, 'user:', !!user, 'userData:', !!userData);

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
