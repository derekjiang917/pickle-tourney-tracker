import dotenv from 'dotenv';
dotenv.config();
const requiredEnvVars = ['DATABASE_URL', 'NODE_ENV', 'PORT'];
function validateEnv() {
    const missing = [];
    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            missing.push(envVar);
        }
    }
    if (missing.length > 0) {
        console.error(`Missing required environment variables: ${missing.join(', ')}`);
        process.exit(1);
    }
}
validateEnv();
export const config = {
    DATABASE_URL: process.env.DATABASE_URL || '',
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '3001', 10),
};
//# sourceMappingURL=index.js.map