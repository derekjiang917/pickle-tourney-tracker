import { Router } from 'express';
import * as tournamentService from '../services/tournamentService.js';
import { formatPaginatedResponse } from '../utils/responseFormatter.js';
const router = Router();
router.get('/', async (req, res, next) => {
    const { page = '1', limit = '10', location, startDate, endDate, skillLevels } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const take = limitNum;
    const filters = {
        location: location,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        skillLevels: skillLevels
            ? (Array.isArray(skillLevels) ? skillLevels : [skillLevels])
            : undefined,
    };
    try {
        const { tournaments, total } = await tournamentService.getTournaments({
            skip,
            take,
            filters,
        });
        const totalPages = Math.ceil(total / limitNum);
        res.json(formatPaginatedResponse(tournaments, {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages,
        }));
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id', async (req, res, next) => {
    try {
        const tournament = await tournamentService.getTournamentById(req.params.id);
        if (!tournament) {
            return res.status(404).json({ error: 'Tournament not found' });
        }
        res.json(tournament);
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=tournaments.js.map