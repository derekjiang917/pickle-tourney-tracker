import { Router, Request, Response, NextFunction } from 'express';
import {
  recordRegistrationClick,
  confirmRegistration,
  declineRegistration,
  getUserRegistrations,
  getPendingRegistrations,
  detectConflicts,
  batchDetectConflicts,
} from '../services/signupService.js';

const router = Router();

/** Middleware: require authenticated user, return 401 otherwise */
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || !req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  next();
}

/** GET /api/signups — get all registrations for current user */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = (req.user as { id: string }).id;
    const registrations = await getUserRegistrations(userId);
    res.json({ registrations });
  } catch (err) {
    next(err);
  }
});

/** GET /api/signups/pending — get pending (unconfirmed) registrations */
router.get('/pending', requireAuth, async (req, res, next) => {
  try {
    const userId = (req.user as { id: string }).id;
    const pending = await getPendingRegistrations(userId);
    res.json({ pending });
  } catch (err) {
    next(err);
  }
});

/** POST /api/signups/click — record that user clicked Register */
router.post('/click', requireAuth, async (req, res, next) => {
  try {
    const userId = (req.user as { id: string }).id;
    const { tournamentId } = req.body as { tournamentId: string };
    if (!tournamentId) {
      res.status(400).json({ error: 'tournamentId required' });
      return;
    }
    const registration = await recordRegistrationClick(userId, tournamentId);
    res.json({ registration });
  } catch (err) {
    next(err);
  }
});

/** PATCH /api/signups/:tournamentId/confirm — user confirms they registered */
router.patch('/:tournamentId/confirm', requireAuth, async (req, res, next) => {
  try {
    const userId = (req.user as { id: string }).id;
    const { tournamentId } = req.params;
    const registration = await confirmRegistration(userId, tournamentId);
    res.json({ registration });
  } catch (err) {
    next(err);
  }
});

/** DELETE /api/signups/:tournamentId — user says they didn't register, remove record */
router.delete('/:tournamentId', requireAuth, async (req, res, next) => {
  try {
    const userId = (req.user as { id: string }).id;
    const { tournamentId } = req.params;
    await declineRegistration(userId, tournamentId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/** GET /api/signups/conflicts/:tournamentId — check conflicts for a specific tournament */
router.get('/conflicts/:tournamentId', requireAuth, async (req, res, next) => {
  try {
    const userId = (req.user as { id: string }).id;
    const { tournamentId } = req.params;
    const conflicts = await detectConflicts(userId, tournamentId);
    res.json({ conflicts, hasConflict: conflicts.length > 0 });
  } catch (err) {
    next(err);
  }
});

/** POST /api/signups/conflicts/batch — batch conflict check for multiple tournaments */
router.post('/conflicts/batch', requireAuth, async (req, res, next) => {
  try {
    const userId = (req.user as { id: string }).id;
    const { tournamentIds } = req.body as { tournamentIds: string[] };
    if (!Array.isArray(tournamentIds)) {
      res.status(400).json({ error: 'tournamentIds array required' });
      return;
    }
    const conflicts = await batchDetectConflicts(userId, tournamentIds);
    res.json({ conflicts });
  } catch (err) {
    next(err);
  }
});

export default router;
