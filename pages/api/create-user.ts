
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminAuth, getAdminDb } from '../../lib/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { email, password, role, nama, noKK, alamatBlok } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and Password are required' });
    }

    try {
        const adminAuth = getAdminAuth();
        const adminDb = getAdminDb();
        console.log(`[API] Mencoba membuat user Auth baru: ${email}`);

        // 1. Create user in Firebase Auth
        const userRecord = await adminAuth.createUser({
            email,
            password,
            displayName: nama || email,
        });

        const uid = userRecord.uid;
        console.log(`[API] User Auth berhasil dibuat: ${uid}`);

        // 2. Create profile in Firestore with the same UID
        await adminDb.collection('users').doc(uid).set({
            email,
            role: role || 'warga',
            nama: nama || '',
            noKK: noKK || '',
            alamatBlok: alamatBlok || '',
            verified: false,
            createdAt: new Date().toISOString()
        });

        console.log(`[API] Profil Firestore berhasil dibuat untuk UID: ${uid}`);

        return res.status(200).json({
            message: 'User created successfully',
            uid: uid
        });

    } catch (error: any) {
        console.error('[API Error Create User]:', error);

        // Handle specific Firebase Auth errors
        if (error.code === 'auth/email-already-exists') {
            try {
                // Check if it's an orphan account (exists in Auth but not in Firestore)
                const auth = getAdminAuth();
                const db = getAdminDb();

                const existingAuthUser = await auth.getUserByEmail(email);
                const uid = existingAuthUser.uid;

                const firestoreDoc = await db.collection('users').doc(uid).get();

                if (!firestoreDoc.exists) {
                    console.log(`[API] Found orphan Auth account for ${email}. Creating missing Firestore profile.`);

                    // Create the missing Firestore profile
                    await db.collection('users').doc(uid).set({
                        email,
                        role: role || 'warga',
                        nama: nama || '',
                        noKK: noKK || '',
                        alamatBlok: alamatBlok || '',
                        verified: false,
                        createdAt: new Date().toISOString()
                    });

                    return res.status(200).json({
                        message: 'Firestore profile linked to existing Auth account successfully',
                        uid: uid
                    });
                }
            } catch (linkError) {
                console.error('[API Error] Failed to check/link existing account:', linkError);
            }

            return res.status(400).json({
                message: 'Email ini sudah digunakan oleh pengguna lain dan memiliki profil aktif.',
                code: error.code
            });
        }

        return res.status(500).json({
            message: 'Gagal membuat pengguna: ' + error.message,
            error: error.message,
            code: error.code
        });
    }
}
