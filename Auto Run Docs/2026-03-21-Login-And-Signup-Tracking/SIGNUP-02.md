# SIGNUP-02: Signup Tracking API

This phase adds the server-side signup tracking service and routes. It handles recording registration clicks, confirming/declining signups, and detecting date-range conflicts between tournaments.

---

## Tasks

- [x] **Create signup service: `server/src/services/signupService.ts`**

  Create `/home/coole/pickle-tourney-tracker/server/src/services/signupService.ts`:

  ```typescript
  import prisma from './prisma.js';

  export interface ConflictInfo {
    tournamentId: string;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
  }

  /** Check if two date-range strings overlap (inclusive). Dates are 'YYYY-MM-DD' strings. */
  function datesOverlap(
    aStart: string, aEnd: string,
    bStart: string, bEnd: string
  ): boolean {
    return aStart <= bEnd && bStart <= aEnd;
  }

  /** Record that a user clicked the Register button for a tournament. Idempotent — does not reset status if already CONFIRMED. */
  export async function recordRegistrationClick(userId: string, tournamentId: string) {
    return prisma.userTournamentRegistration.upsert({
      where: { userId_tournamentId: { userId, tournamentId } },
      update: { clickedAt: new Date() }, // only update clickedAt if already exists as PENDING
      create: { userId, tournamentId, status: 'PENDING' },
    });
  }

  /** Confirm that a user actually completed registration externally. */
  export async function confirmRegistration(userId: string, tournamentId: string) {
    return prisma.userTournamentRegistration.update({
      where: { userId_tournamentId: { userId, tournamentId } },
      data: { status: 'CONFIRMED', confirmedAt: new Date() },
    });
  }

  /** Decline/remove a pending registration record entirely. */
  export async function declineRegistration(userId: string, tournamentId: string) {
    return prisma.userTournamentRegistration.deleteMany({
      where: { userId, tournamentId },
    });
  }

  /** Get all registrations for a user, joined with tournament data. */
  export async function getUserRegistrations(userId: string) {
    return prisma.userTournamentRegistration.findMany({
      where: { userId },
      include: {
        tournament: {
          select: { id: true, name: true, startDate: true, endDate: true, city: true, state: true, imageUrl: true },
        },
      },
      orderBy: { clickedAt: 'desc' },
    });
  }

  /** Get pending (unconfirmed) registrations for a user — used for the confirmation popup. */
  export async function getPendingRegistrations(userId: string) {
    return prisma.userTournamentRegistration.findMany({
      where: { userId, status: 'PENDING' },
      include: {
        tournament: {
          select: { id: true, name: true, startDate: true, endDate: true, city: true, state: true, imageUrl: true },
        },
      },
      orderBy: { clickedAt: 'desc' },
    });
  }

  /**
   * Detect conflicts for a given tournament against the user's confirmed + pending registrations.
   * A conflict is any existing registration whose tournament date range overlaps with the target tournament.
   */
  export async function detectConflicts(userId: string, tournamentId: string): Promise<ConflictInfo[]> {
    const target = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { startDate: true, endDate: true },
    });
    if (!target) return [];

    const existing = await prisma.userTournamentRegistration.findMany({
      where: {
        userId,
        tournamentId: { not: tournamentId },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      include: {
        tournament: { select: { id: true, name: true, startDate: true, endDate: true } },
      },
    });

    return existing
      .filter((r) =>
        datesOverlap(
          target.startDate, target.endDate,
          r.tournament.startDate, r.tournament.endDate
        )
      )
      .map((r) => ({
        tournamentId: r.tournament.id,
        name: r.tournament.name,
        startDate: r.tournament.startDate,
        endDate: r.tournament.endDate,
        status: r.status,
      }));
  }

  /**
   * Get conflict info for multiple tournaments at once — used by the frontend
   * to batch-check which tournaments conflict with the user's schedule.
   */
  export async function batchDetectConflicts(
    userId: string,
    tournamentIds: string[]
  ): Promise<Record<string, ConflictInfo[]>> {
    const [registrations, targets] = await Promise.all([
      prisma.userTournamentRegistration.findMany({
        where: { userId, status: { in: ['PENDING', 'CONFIRMED'] } },
        include: { tournament: { select: { id: true, name: true, startDate: true, endDate: true } } },
      }),
      prisma.tournament.findMany({
        where: { id: { in: tournamentIds } },
        select: { id: true, startDate: true, endDate: true },
      }),
    ]);

    const result: Record<string, ConflictInfo[]> = {};

    for (const target of targets) {
      const conflicts = registrations
        .filter(
          (r) =>
            r.tournamentId !== target.id &&
            datesOverlap(target.startDate, target.endDate, r.tournament.startDate, r.tournament.endDate)
        )
        .map((r) => ({
          tournamentId: r.tournament.id,
          name: r.tournament.name,
          startDate: r.tournament.startDate,
          endDate: r.tournament.endDate,
          status: r.status,
        }));
      result[target.id] = conflicts;
    }

    return result;
  }
  ```

- [x] **Create signup routes: `server/src/routes/signups.ts`**

  Create `/home/coole/pickle-tourney-tracker/server/src/routes/signups.ts`:

  ```typescript
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
  ```

- [x] **Register signup routes in Express app: `server/src/index.ts`**

  Read `/home/coole/pickle-tourney-tracker/server/src/index.ts`.

  Add the import:
  ```typescript
  import signupRoutes from './routes/signups.js';
  ```

  Register the route (after existing route registrations):
  ```typescript
  app.use('/api/signups', signupRoutes);
  ```

  Run `npm run typecheck` from the root to confirm no TypeScript errors.
