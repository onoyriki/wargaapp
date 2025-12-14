
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
  jenisKelamin?: string; // FIX: Added optional jenisKelamin
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
          // FIX: Handle potential null email from Firebase user object
          setUserData({ email: user.email || '', ...userDoc.data() });
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
    if (userData?.email) {
      const wargaQuery = query(collection(db, 'warga'), where("email", "==", userData.email));
      
      const unsubscribe = onSnapshot(wargaQuery, (querySnapshot) => {
        if (!querySnapshot.empty) {
          const wargaDoc = querySnapshot.docs[0];
          // Merge previous data with warga data, crucially adding the ID
          setUserData(prevData => ({
            ...prevData,
            ...wargaDoc.data(),
            id: wargaDoc.id, // This solves the problem
          }));
        }
        setLoading(false);
      }, (error) => {
        console.error("Error fetching warga data:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    } else if (!loadingAuth && !user) {
        setLoading(false);
    }
  }, [userData?.email, user, loadingAuth]);

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
