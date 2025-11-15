import { useEffect, useState } from 'react';
import { getLastSyncTimestamp } from '../utils/offlineCache';

const getInitialOfflineState = () => {
    if (typeof navigator === 'undefined') return false;
    return !navigator.onLine;
};

const useOfflineStatus = () => {
    const [isOffline, setIsOffline] = useState(getInitialOfflineState);
    const [lastSyncedAt, setLastSyncedAt] = useState(() => getLastSyncTimestamp());

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const handleStatusChange = () => {
            setIsOffline(typeof navigator !== 'undefined' ? !navigator.onLine : false);
        };

        window.addEventListener('online', handleStatusChange);
        window.addEventListener('offline', handleStatusChange);

        return () => {
            window.removeEventListener('online', handleStatusChange);
            window.removeEventListener('offline', handleStatusChange);
        };
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const handleSyncEvent = (event) => {
            setLastSyncedAt(event?.detail?.lastSyncedAt || getLastSyncTimestamp());
        };

        window.addEventListener('offline-cache:synced', handleSyncEvent);
        return () => window.removeEventListener('offline-cache:synced', handleSyncEvent);
    }, []);

    return { isOffline, lastSyncedAt };
};

export default useOfflineStatus;
