import React from 'react';
import { WifiOff } from 'lucide-react';
import useOfflineStatus from '../../hooks/useOfflineStatus';

const OfflineIndicator = () => {
    const { isOffline, lastSyncedAt } = useOfflineStatus();

    if (!isOffline) {
        return null;
    }

    const formattedSyncTime = lastSyncedAt
        ? new Date(Number(lastSyncedAt)).toLocaleString()
        : 'Unavailable';

    return (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/60">
                <WifiOff className="h-4 w-4" />
            </div>
            <div className="text-sm leading-relaxed">
                <p className="font-semibold tracking-wide">Offline mode enabled</p>
                <p className="text-xs text-amber-800">
                    Last synced: {formattedSyncTime}. Your latest cached data is available and will refresh
                    automatically once you are back online.
                </p>
            </div>
        </div>
    );
};

export default OfflineIndicator;
