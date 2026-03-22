# SIGNUP-01: Google Cloud Setup + Backend Auth Infrastructure

This phase sets up Google OAuth 2.0 authentication on the server using Passport.js and express-session. It also extends the Prisma schema to support users and tournament registration tracking.

---

## Manual Setup: Google Cloud Project (Do this before running tasks)

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. Click **Select a project** → **New Project**. Name it `pickle-tourney-tracker`. Click **Create**.
3. In the left sidebar, go to **APIs & Services → OAuth consent screen**
   - Choose **External** user type → **Create**
   - Fill in **App name**: `Pickle Tourney Tracker`, **User support email**: your email, **Developer contact**: your email
   - Scopes: click **Add or Remove Scopes** → add `email` and `profile` → Save and Continue
   - Test users: add your own Google email → Save and Continue → Back to Dashboard
4. In the left sidebar, go to **APIs & Services → Credentials**
   - Click **+ Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Name: `pickle-tourney-tracker-local`
   - **Authorized JavaScript origins** — add both:
     - `http://localhost:5173`
     - `http://localhost:5174`
   - **Authorized redirect URIs** — add:
     - `http://localhost:3001/auth/google/callback`
   - Click **Create**
5. Copy the **Client ID** and **Client Secret** shown in the popup
6. Add them to `/home/coole/pickle-tourney-tracker/server/.env`:
   ```
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   SESSION_SECRET=some-long-random-string-here
   ```
   (Generate SESSION_SECRET with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

> **Note on callback URL**: The OAuth callback always hits the server at `http://localhost:3001/auth/google/callback` regardless of which port Vite uses. After the server handles the callback, it redirects the browser to `http://localhost:5173`. If Vite is on 5174, update the redirect in `server/src/routes/auth.ts` after the fact.

---

## Tasks

- [x] **Extend Prisma schema: update User model and add UserTournamentRegistration model**

  Update `/home/coole/pickle-tourney-tracker/server/prisma/schema.prisma`.

  Replace the existing `User` model with:
  ```prisma
  model User {
    id          String   @id @default(uuid())
    googleId    String   @unique
    email       String   @unique
    name        String
    avatarUrl   String?
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt

    registrations UserTournamentRegistration[]
  }
  ```

  Add a new `UserTournamentRegistration` model (after the User model):
  ```prisma
  model UserTournamentRegistration {
    id           String   @id @default(uuid())
    userId       String
    tournamentId String
    status       String   @default("PENDING") // PENDING | CONFIRMED
    clickedAt    DateTime @default(now())
    confirmedAt  DateTime?
    createdAt    DateTime @default(now())
    updatedAt    DateTime @updatedAt

    user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
    tournament   Tournament @relation(fields: [tournamentId], references: [id], onDelete: Cascade)

    @@unique([userId, tournamentId])
    @@index([userId])
    @@index([tournamentId])
    @@index([userId, status])
  }
  ```

  Also add the back-relation to `Tournament`:
  ```prisma
  registrations UserTournamentRegistration[]
  ```

  After editing, run from `/home/coole/pickle-tourney-tracker/server/`:
  ```bash
  npx prisma generate && npx prisma db push
  ```

- [x] **Install server auth dependencies**

  From `/home/coole/pickle-tourney-tracker/server/`:
  ```bash
  npm install passport passport-google-oauth20 express-session connect-sqlite3
  npm install --save-dev @types/passport @types/passport-google-oauth20 @types/express-session @types/connect-sqlite3
  ```

- [x] **Create Passport Google OAuth strategy: `server/src/auth/passport.ts`**

  Create `/home/coole/pickle-tourney-tracker/server/src/auth/passport.ts`:

  ```typescript
  import passport from 'passport';
  import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
  import prisma from '../services/prisma.js';

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: 'http://localhost:3001/auth/google/callback',
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value ?? '';
          const avatarUrl = profile.photos?.[0]?.value ?? null;

          const user = await prisma.user.upsert({
            where: { googleId: profile.id },
            update: { email, name: profile.displayName, avatarUrl },
            create: {
              googleId: profile.id,
              email,
              name: profile.displayName,
              avatarUrl,
            },
          });

          done(null, user);
        } catch (err) {
          done(err as Error);
        }
      }
    )
  );

  passport.serializeUser((user: Express.User, done) => {
    done(null, (user as { id: string }).id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  export default passport;
  ```

- [x] **Replace stub auth routes: `server/src/routes/auth.ts`**

  Overwrite `/home/coole/pickle-tourney-tracker/server/src/routes/auth.ts` with:

  ```typescript
  import { Router } from 'express';
  import passport from '../auth/passport.js';

  const router = Router();

  // Initiate Google OAuth flow
  router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  // Google OAuth callback
  router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: 'http://localhost:5173/?auth=error' }),
    (_req, res) => {
      // Successful auth — redirect to frontend
      res.redirect('http://localhost:5173/?auth=success');
    }
  );

  // Auth status for frontend polling
  router.get('/status', (req, res) => {
    if (req.isAuthenticated() && req.user) {
      const user = req.user as { id: string; email: string; name: string; avatarUrl: string | null };
      res.json({ authenticated: true, user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl } });
    } else {
      res.json({ authenticated: false, user: null });
    }
  });

  // Logout
  router.post('/logout', (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ success: true });
    });
  });

  export default router;
  ```

- [x] **Wire session middleware and Passport into Express app: `server/src/index.ts`**

  Read `/home/coole/pickle-tourney-tracker/server/src/index.ts` first.

  Add the following imports near the top (after existing imports):
  ```typescript
  import session from 'express-session';
  import connectSqlite3 from 'connect-sqlite3';
  import '../auth/passport.js';
  import passport from 'passport';
  ```

  Add session and passport middleware before the route registrations (after `app.use(cors(...))` or similar):
  ```typescript
  const SQLiteStore = connectSqlite3(session);

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
  ```

  Also add `/auth` proxy to the Vite config so auth calls from the client go through the dev proxy. Update `/home/coole/pickle-tourney-tracker/client/vite.config.ts`:
  ```typescript
  proxy: {
    '/api': { target: 'http://localhost:3001', changeOrigin: true },
    '/auth': { target: 'http://localhost:3001', changeOrigin: true },
  },
  ```

  Run `npm run typecheck` from the root to confirm no TypeScript errors.

- [x] **Add type declaration for express-session user: `server/src/types/express-session.d.ts`**

  Create `/home/coole/pickle-tourney-tracker/server/src/types/express-session.d.ts`:
  ```typescript
  import 'express-session';
  import type { User } from '@prisma/client';

  declare module 'express-session' {
    interface SessionData {
      passport: { user: string };
    }
  }

  declare global {
    namespace Express {
      interface User {
        id: string;
        googleId: string;
        email: string;
        name: string;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
      }
    }
  }
  ```

  Run `npm run typecheck` from the root to confirm no TypeScript errors.
