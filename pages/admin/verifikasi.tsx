
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { collection, getDocs, doc, updateDoc, DocumentData } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/hooks';
import { withAuth } from '../../components/withAuth';
import Layout from '../../components/Layout';
import styles from '../../styles/Admin.module.css';

interface User extends DocumentData {
  id: string;
  email: string;
  role: string;
  verified: boolean;
  alamatBlok: string;
}

function AdminVerificationPage() {
  const { userData } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      if (userData?.role !== 'admin') {
        setLoading(false);
        setError('You do not have permission to view this page.');
        return;
      }
      try {
        const usersCollection = collection(db, 'users');
        const userSnapshot = await getDocs(usersCollection);
        const usersList = userSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as User));
        setUsers(usersList);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError('Failed to load user data.');
      } finally {
        setLoading(false);
      }
    };

    if (userData) {
      fetchUsers();
    }

  }, [userData]);

  const handleUpdateUser = async (id: string, newRole: string, newVerifiedStatus: boolean) => {
    try {
      const userDocRef = doc(db, 'users', id);
      await updateDoc(userDocRef, { role: newRole, verified: newVerifiedStatus });
      setUsers(users.map(user => user.id === id ? { ...user, role: newRole, verified: newVerifiedStatus } : user));
    } catch (error) {
      console.error("Error updating user:", error);
      alert('Failed to update user.');
    }
  };

  if (loading) {
    return <Layout><p>Loading users...</p></Layout>;
  }

  if (userData?.role !== 'admin') {
    return <Layout><p>Access Denied. You must be an admin to view this page.</p></Layout>;
  }

  return (
    <Layout>
      <Head>
        <title>Admin - User Verification</title>
      </Head>
      <div className={styles.adminContainer}>
        <h1>User Management</h1>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Address</th>
                <th>Role</th>
                <th>Verified</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td data-label="Email">{user.email}</td>
                  <td data-label="Address">{user.alamatBlok}</td>
                  <td data-label="Role">
                    <select
                      value={user.role}
                      onChange={(e) => handleUpdateUser(user.id, e.target.value, user.verified)}
                      className={styles.select}
                    >
                      <option value="warga">Warga</option>
                      <option value="satpam">Satpam</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td data-label="Verified">{user.verified ? 'Yes' : 'No'}</td>
                  <td data-label="Actions">
                    <button
                      onClick={() => handleUpdateUser(user.id, user.role, !user.verified)}
                      className={`${styles.button} ${user.verified ? styles.unverifyButton : styles.verifyButton}`}>
                      {user.verified ? 'Un-verify' : 'Verify'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

export default withAuth(AdminVerificationPage);
