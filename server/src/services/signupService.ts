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
