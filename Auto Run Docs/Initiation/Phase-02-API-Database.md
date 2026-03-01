# Phase 02: API Endpoints & Database Integration

This phase builds out the REST API for tournaments with filtering, pagination, and database integration. It connects the Express server to PostgreSQL via Prisma and creates endpoints that the frontend will consume.

## Tasks

- [ ] Create tournament API routes in `server/src/routes/tournaments.ts` with GET endpoint supporting query params: page, limit, location, startDate, endDate, skillLevels (array)

- [ ] Implement Prisma queries in tournament service with proper filtering: location (city/state search), date range filtering, skill level filtering, and pagination (skip/take)

- [ ] Add database seeding script in `server/prisma/seed.ts` with 10-15 sample tournaments from different locations/dates/skill levels for testing

- [ ] Create response formatter utility to standardize API responses with pagination metadata (page, limit, total, totalPages)

- [ ] Add error handling middleware in `server/src/middleware/errorHandler.ts` for consistent error responses

- [ ] Create GET /tournaments/:id endpoint to fetch single tournament details

- [ ] Update client to fetch from API: create `client/src/lib/api.ts` with fetchTournaments function, replace mock data with API calls

- [ ] Add loading and error states to TournamentList component using React Suspense or useState

- [ ] Run database migration and seed script, verify API returns tournament data correctly with all filter combinations
