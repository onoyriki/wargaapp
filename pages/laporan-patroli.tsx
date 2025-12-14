
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/hooks';
import Layout from '../components/Layout';
import { withAuth } from '../components/withAuth';
import styles from '../styles/Laporan.module.css';

interface Laporan {
    id: string;
    tanggal: any;
    shift: string;
    isi: string;
    petugas: string;
}

function LaporanPatroliPage() {
    const { userData } = useAuth();
    const [laporan, setLaporan] = useState<Laporan[]>([]);
    const [shift, setShift] = useState('Pagi');
    const [isiLaporan, setIsiLaporan] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const q = query(collection(db, 'laporanPatroli'), orderBy('tanggal', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const laporanData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Laporan));
            setLaporan(laporanData);
        });
        return () => unsubscribe();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isiLaporan) {
            setError('Laporan tidak boleh kosong.');
            return;
        }
        setIsSubmitting(true);
        setError('');

        try {
            await addDoc(collection(db, 'laporanPatroli'), {
                tanggal: serverTimestamp(),
                shift,
                isi: isiLaporan,
                petugas: userData?.nama || 'Petugas'
            });
            setIsiLaporan('');
        } catch (err) {
            console.error(err);
            setError('Gagal mengirim laporan.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Layout>
            <Head><title>Laporan Patroli - WargaKoba</title></Head>
            {/* Form and list components remain unchanged */}
        </Layout>
    );
}

// FIX: Corrected the withAuth call
export default withAuth(LaporanPatroliPage);
