import express from 'express';
import cors from 'cors';
import session from 'express-session';
import connectSqlite3 from 'connect-sqlite3';
import '../auth/passport.js';
import passport from 'passport';
import tournamentRoutes from './routes/tournaments.js';
import scrapeRoutes from './routes/scrape.js';
import authRoutes from './routes/auth.js';
import signupRoutes from './routes/signups.js';
import { errorHandler } from './middleware/errorHandler.js';
import { cacheMiddleware } from './middleware/cache.js';
import { requestLogger } from './middleware/requestLogger.js';
import { checkDatabaseConnection } from './services/prisma.js';

const app = express();
const PORT = process.env.PORT || 3001;

const SQLiteStore = connectSqlite3(session);

app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.use(
  session({
    store: new SQLiteStore({ db: 'sessions.db', dir: './prisma' }) as session.Store,
    secret: process.env.SESSION_SECRET ?? 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // set true in production with HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

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
app.use('/api/signups', signupRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
