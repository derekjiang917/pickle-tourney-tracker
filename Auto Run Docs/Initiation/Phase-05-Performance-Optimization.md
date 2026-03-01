# Phase 05: Polish & Performance Optimization

This phase adds caching, database optimization, Railway deployment readiness, and v2 login preparation. It ensures the app is fast, production-ready, and extensible.

## Tasks

- [ ] Add database indexes in Prisma schema: compound index on (city, state, startDate), index on startDate, index on skillLevels, run migration

- [ ] Implement API response caching in `server/src/middleware/cache.ts` using node-cache with 5-minute TTL for tournament list endpoint

- [ ] Add cache invalidation: clear cache when scraper runs or tournament data updates

- [ ] Configure Railway deployment: add railway.json config, update Procfile with proper start commands, set up client build for production serve

- [ ] Add health check endpoint that verifies database connection and returns status

- [ ] Prepare v2 login infrastructure: add User model to Prisma schema (id, email, name, createdAt), create users table, add placeholder /auth routes (GET /auth/status, POST /auth/login stub returning "coming soon")

- [ ] Add request logging middleware for debugging: log method, path, duration, status code

- [ ] Create environment configuration in `server/src/config/index.ts` with validation for required env vars (DATABASE_URL, NODE_ENV, PORT)

- [ ] Add client-side error boundary and graceful error handling for failed API calls with retry option

- [ ] Verify production build works: run client build, test server starts, confirm all endpoints respond correctly
