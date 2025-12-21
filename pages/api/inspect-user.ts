
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminAuth, getAdminDb } from '../../lib/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { email } = req.query;

    if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: 'Email query parameter is required' });
    }

    try {
        console.log('[Inspect] Starting inspection for:', email);
        const auth = getAdminAuth();
        const db = getAdminDb();
        console.log('[Inspect] Admin services obtained');

        let authUser = null;
        try {
            console.log('[Inspect] Checking Auth for:', email);
            authUser = await auth.getUserByEmail(email);
            console.log('[Inspect] Auth found:', !!authUser);
        } catch (e: any) {
            console.log('[Inspect] Auth check code:', e.code);
            if (e.code !== 'auth/user-not-found') throw e;
        }

        let firestoreData = null;
        let firestoreByUID = null;

        if (authUser) {
            console.log('[Inspect] Checking Firestore by UID:', authUser.uid);
            const doc = await db.collection('users').doc(authUser.uid).get();
            if (doc.exists) {
                firestoreByUID = { id: doc.id, ...doc.data() };
            }
        }

        // Search firestore by email field just in case UID doesn't match
        console.log('[Inspect] Querying Firestore by email field...');
        const snapshot = await db.collection('users').where('email', '==', email).get();
        if (!snapshot.empty) {
            firestoreData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        }
        console.log('[Inspect] Querying complete');

        return res.status(200).json({
            email,
            existsInAuth: !!authUser,
            authUID: authUser?.uid || null,
            firestoreMatchByUID: firestoreByUID,
            firestoreMatchesByEmail: firestoreData,
            rawAuth: authUser
        });

    } catch (error: any) {
        return res.status(500).json({
            message: 'Inspection failed',
            error: error.message
        });
    }
}
