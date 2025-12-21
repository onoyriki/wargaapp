
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminAuth } from '../../lib/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const auth = getAdminAuth();
        const apps = require('firebase-admin').apps.length;
        return res.status(200).json({
            status: 'ok',
            message: 'Firebase Admin initialized',
            appsCount: apps,
            projectId: process.env.GOOGLE_CLOUD_PROJECT || 'not-set'
        });
    } catch (error: any) {
        return res.status(500).json({
            status: 'error',
            message: 'Firebase Admin failed to initialize',
            error: error.message,
            stack: error.stack
        });
    }
}
