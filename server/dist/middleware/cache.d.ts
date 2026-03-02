import { Request, Response, NextFunction } from 'express';
import NodeCache from 'node-cache';
export declare const cache: NodeCache;
export declare const cacheMiddleware: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const clearCache: (pattern?: string) => void;
//# sourceMappingURL=cache.d.ts.map