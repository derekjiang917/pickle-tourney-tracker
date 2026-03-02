import express from 'express';
import cors from 'cors';
import tournamentRoutes from './routes/tournaments.js';
import scrapeRoutes from './routes/scrape.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/tournaments', tournamentRoutes);
app.use('/api/scrape', scrapeRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
