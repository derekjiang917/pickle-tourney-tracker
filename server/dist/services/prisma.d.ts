import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
declare const prisma: PrismaClient<{
    adapter: PrismaBetterSqlite3;
}, never, import("@prisma/client/runtime/client").DefaultArgs>;
export declare const checkDatabaseConnection: () => Promise<boolean>;
export default prisma;
//# sourceMappingURL=prisma.d.ts.map