const CACHE_STORAGE_KEY = 'financial-dashboard:offline-cache';
const LAST_SYNC_STORAGE_KEY = 'financial-dashboard:last-sync';
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours
const MAX_ENTRIES = 40;

const canUseStorage = () =>
    typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const readCache = () => {
    if (!canUseStorage()) return {};
    try {
        const raw = window.localStorage.getItem(CACHE_STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
};

const writeCache = (cache) => {
    if (!canUseStorage()) return;
    window.localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cache));
};

const persistLastSync = (timestamp) => {
    if (!canUseStorage()) return;
    window.localStorage.setItem(LAST_SYNC_STORAGE_KEY, String(timestamp));
    if (typeof window.CustomEvent === 'function') {
        window.dispatchEvent(new CustomEvent('offline-cache:synced', {
            detail: { lastSyncedAt: timestamp }
        }));
    }
};

const trimCache = (cache) => {
    const keys = Object.keys(cache);
    if (keys.length <= MAX_ENTRIES) {
        return cache;
    }

    const sorted = keys.sort((a, b) => (cache[a].timestamp || 0) - (cache[b].timestamp || 0));
    const keysToRemove = sorted.slice(0, keys.length - MAX_ENTRIES);
    keysToRemove.forEach((key) => delete cache[key]);
    return cache;
};

export const offlineCache = {
    set(key, value) {
        if (!canUseStorage() || !key) return;
        const cache = readCache();
        cache[key] = {
            data: value,
            timestamp: Date.now()
        };
        const trimmed = trimCache(cache);
        writeCache(trimmed);
        persistLastSync(Date.now());
    },
    get(key) {
        if (!canUseStorage() || !key) return null;
        const cache = readCache();
        const entry = cache[key];
        if (!entry) return null;

        if (Date.now() - entry.timestamp > CACHE_TTL) {
            delete cache[key];
            writeCache(cache);
            return null;
        }

        return entry.data;
    }
};

export const buildCacheKey = (config = {}) => {
    const baseUrl = `${config.baseURL || ''}${config.url || ''}`.replace(/([^:]\/)\/+/g, '$1');
    const params = config.params || {};
    const sortedKeys = Object.keys(params).sort();
    const serializedParams = sortedKeys
        .map((key) => `${key}:${JSON.stringify(params[key])}`)
        .join('|');
    return serializedParams ? `${baseUrl}?${serializedParams}` : baseUrl;
};

export const getLastSyncTimestamp = () => {
    if (!canUseStorage()) return null;
    return window.localStorage.getItem(LAST_SYNC_STORAGE_KEY);
};
