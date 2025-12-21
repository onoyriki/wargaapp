
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
    if (loadingAuth) {
      setLoading(true);
      return;
    }

    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userDocRef, (userDoc) => {
        if (userDoc.exists()) {
          const data = userDoc.data() as any;
          setUserData({ email: user.email || '', ...data });

          // Only keep loading for warga role (will be resolved in Effect 2)
          if (data?.role !== 'warga') {
            setLoading(false);
          }
        } else {
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
      setUserData(null);
      setLoading(false);
    }
  }, [user, loadingAuth]);

  // Effect 2: Fetch corresponding 'warga' data once we have the user's email
  useEffect(() => {
    if (userData?.email && userData?.role === 'warga') {
      const email = userData.email.toLowerCase().trim();
      const wargaQuery = query(collection(db, 'warga'), where("email", "==", email));

      const unsubscribe = onSnapshot(wargaQuery, (querySnapshot) => {
        if (!querySnapshot.empty) {
          const wargaDoc = querySnapshot.docs[0];
          const data = wargaDoc.data();
          // Merge previous data with warga data, crucially adding the ID
          setUserData(prevData => {
            const merged = {
              ...prevData,
              ...data,
              id: wargaDoc.id,
            };
            return merged;
          });
        }
        setLoading(false);
      }, (error) => {
        console.error("Error fetching warga data:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [userData?.email, userData?.role]);

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
