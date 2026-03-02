import { Router, Request, Response, NextFunction } from 'express';
import * as tournamentService from '../services/tournamentService.js';
import { formatPaginatedResponse } from '../utils/responseFormatter.js';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  const { page = '1', limit = '10', location, startDate, endDate, skillLevels } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;
  const take = limitNum;

  const filters = {
    location: location as string | undefined,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
    skillLevels: skillLevels
      ? (Array.isArray(skillLevels) ? skillLevels : [skillLevels]) as string[]
      : undefined,
  };

  try {
    const { tournaments, total } = await tournamentService.getTournaments({
      skip,
      take,
      filters,
    });

    const totalPages = Math.ceil(total / limitNum);

    res.json(
      formatPaginatedResponse(tournaments, {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      })
    );
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: Request, res: Response, next) => {
  try {
    const tournament = await tournamentService.getTournamentById(req.params.id);

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    res.json(tournament);
  } catch (error) {
    next(error);
  }
});

export default router;
