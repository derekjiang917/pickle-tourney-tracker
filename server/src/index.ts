import express from 'express';
import cors from 'cors';
import tournamentRoutes from './routes/tournaments.js';
import scrapeRoutes from './routes/scrape.js';
import authRoutes from './routes/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { cacheMiddleware } from './middleware/cache.js';
import { requestLogger } from './middleware/requestLogger.js';
import { checkDatabaseConnection } from './services/prisma.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.get('/health', async (_req, res) => {
  const dbHealthy = await checkDatabaseConnection();
  const status = dbHealthy ? 'ok' : 'degraded';
  const statusCode = dbHealthy ? 200 : 503;
  
  res.status(statusCode).json({ 
    status, 
    timestamp: new Date().toISOString(),
    database: dbHealthy ? 'connected' : 'disconnected'
  });
});

app.use('/api/tournaments', cacheMiddleware, tournamentRoutes);
app.use('/api/scrape', scrapeRoutes);
app.use('/auth', authRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
