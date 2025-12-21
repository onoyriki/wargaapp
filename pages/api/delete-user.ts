
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminAuth } from '../../lib/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { uid } = req.body;

    if (!uid) {
        return res.status(400).json({ message: 'UID is required' });
    }

    try {
        const adminAuth = getAdminAuth();
        console.log(`[API] Menghapus user Auth dengan UID: ${uid}`);
        // Delete the user from Firebase Auth
        await adminAuth.deleteUser(uid);
        console.log('[API] User Auth berhasil dihapus');
        return res.status(200).json({ message: 'User deleted from Auth successfully' });
    } catch (error: any) {
        console.error('[API Error]:', error);
        if (error.code === 'auth/user-not-found') {
            return res.status(200).json({ message: 'User already gone from Auth' });
        }
        return res.status(500).json({
            message: 'Error deleting user from Auth',
            error: error.message,
            code: error.code
        });
    }
}
