import { Router, Request, Response, NextFunction } from 'express';
import {
  runScrapeJob,
  getLastScrapeStatus,
  getScrapeHistory,
  isJobRunning,
  startScheduler,
  stopScheduler,
} from '../jobs/scheduler.js';
import { clearCache } from '../middleware/cache.js';

const router = Router();

router.post('/trigger', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (isJobRunning()) {
      return res.status(409).json({
        error: 'Scrape job is already running',
      });
    }

    const source = req.body.source as string | undefined;
    const availableSources = ['pickleballtournaments.com', 'maincourt.com'];
    
    if (source && !availableSources.includes(source)) {
      return res.status(400).json({
        error: `Invalid source. Available sources: ${availableSources.join(', ')}`,
      });
    }

    const result = await runScrapeJob({ source });
    clearCache('/api/tournaments');

    res.json({
      success: result.success,
      message: result.success ? 'Scrape completed successfully' : 'Scrape completed with errors',
      data: {
        source: source || 'all',
        tournamentsFound: result.tournamentsFound,
        tournamentsCreated: result.tournamentsCreated,
        tournamentsUpdated: result.tournamentsUpdated,
        errors: result.errors,
        duration: result.duration,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lastRun = await getLastScrapeStatus();
    const running = isJobRunning();

    res.json({
      isRunning: running,
      lastRun: lastRun
        ? {
            id: lastRun.id,
            source: lastRun.source,
            startTime: lastRun.startTime,
            endTime: lastRun.endTime,
            tournamentsFound: lastRun.tournamentsFound,
            errors: lastRun.errors,
            status: lastRun.status,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const history = await getScrapeHistory(limit);

    res.json({
      history: history.map((run) => ({
        id: run.id,
        source: run.source,
        startTime: run.startTime,
        endTime: run.endTime,
        tournamentsFound: run.tournamentsFound,
        errors: run.errors,
        status: run.status,
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/scheduler/start', (_req: Request, res: Response) => {
  startScheduler();
  res.json({ message: 'Scheduler started' });
});

router.post('/scheduler/stop', (_req: Request, res: Response) => {
  stopScheduler();
  res.json({ message: 'Scheduler stopped' });
});

export default router;
