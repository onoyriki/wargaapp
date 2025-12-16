import { useState, useEffect } from 'react';
import { collection, getDocs, Firestore, Query } from 'firebase/firestore';

interface CacheOptions {
    key: string; // Unique key for localStorage
    ttl: number; // Time to live in milliseconds
}

interface CacheWrap<T> {
    data: T;
    timestamp: number;
}

export function useStaticData<T>(
    query: Query,
    options: CacheOptions
) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Try to load from localStorage
                const cached = localStorage.getItem(options.key);
                if (cached) {
                    const parsed: CacheWrap<T[]> = JSON.parse(cached);
                    const now = Date.now();

                    // Check if cache is strictly valid (not expired)
                    if (now - parsed.timestamp < options.ttl) {
                        console.log(`[Cache Hit] Serving ${options.key} from LocalStorage`);
                        setData(parsed.data);
                        setLoading(false);
                        return; // Stop here, use cached data
                    }
                }

                // 2. If expired or not exists, fetch from Firestore
                console.log(`[Cache Miss] Fetching ${options.key} from Firestore...`);
                const snapshot = await getDocs(query);
                const result = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as T));

                // 3. Save to localStorage
                const cacheData: CacheWrap<T[]> = {
                    data: result,
                    timestamp: Date.now()
                };
                localStorage.setItem(options.key, JSON.stringify(cacheData));

                setData(result);
            } catch (err: any) {
                console.error("Error fetching static data:", err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [options.key, options.ttl]); // Re-run only if key/ttl changes. Query dependency ignored to avoid loops if unstable.

    const refresh = () => {
        localStorage.removeItem(options.key);
        // Force reload by simple window reload or sophisticated state reset, 
        // effectively next mount will fetch new data.
        window.location.reload();
    };

    return { data, loading, error, refresh };
}
