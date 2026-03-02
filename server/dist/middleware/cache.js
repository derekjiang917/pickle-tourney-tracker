import NodeCache from 'node-cache';
export const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
export const cacheMiddleware = (req, res, next) => {
    if (req.method !== 'GET') {
        return next();
    }
    const key = req.originalUrl || req.url;
    const cachedData = cache.get(key);
    if (cachedData) {
        return res.status(200).json(cachedData);
    }
    const originalJson = res.json.bind(res);
    res.json = (data) => {
        cache.set(key, data);
        return originalJson(data);
    };
    next();
};
export const clearCache = (pattern) => {
    if (pattern) {
        const keys = cache.keys();
        const matchingKeys = keys.filter((key) => key.includes(pattern));
        matchingKeys.forEach((key) => cache.del(key));
    }
    else {
        cache.flushAll();
    }
};
//# sourceMappingURL=cache.js.map