import { Request, Response, NextFunction } from 'express';
import NodeCache from 'node-cache';

export const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

export const cacheMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.method !== 'GET') {
    return next();
  }

  const key = req.originalUrl || req.url;
  const cachedData = cache.get(key);

  if (cachedData) {
    return res.status(200).json(cachedData);
  }

  const originalJson = res.json.bind(res);
  (res as Response & { cachedData?: unknown }).json = (data: unknown) => {
    cache.set(key, data);
    return originalJson(data);
  };

  next();
};

export const clearCache = (pattern?: string) => {
  if (pattern) {
    const keys = cache.keys();
    const matchingKeys = keys.filter((key) => key.includes(pattern));
    matchingKeys.forEach((key) => cache.del(key));
  } else {
    cache.flushAll();
  }
};
