# SIGNUP-04: Frontend Implementation

This phase wires up the auth and signup tracking features in the React app. It adds an auth context, modifies the register button to reflect signup state, adds confirmation popups for pending registrations, shows signed-up badges on tournament cards, and highlights schedule conflicts.

**Prerequisite**: Complete SIGNUP-01 and SIGNUP-02 first. Also decide which design from SIGNUP-03 to implement before running this phase — the component styles should match the chosen design.

---

## Tasks

- [ ] **Create auth context and hook: `client/src/contexts/AuthContext.tsx`**

  Create `/home/coole/pickle-tourney-tracker/client/src/contexts/AuthContext.tsx`:

  ```typescript
  import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

  interface AuthUser {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
  }

  interface AuthContextValue {
    user: AuthUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: () => void;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;
  }

  const AuthContext = createContext<AuthContextValue | null>(null);

  export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refresh = useCallback(async () => {
      try {
        const res = await fetch('/auth/status', { credentials: 'include' });
        const data = await res.json() as { authenticated: boolean; user: AuthUser | null };
        setUser(data.authenticated ? data.user : null);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }, []);

    useEffect(() => {
      void refresh();

      // Handle redirect back from OAuth (auth=success or auth=error in URL)
      const params = new URLSearchParams(window.location.search);
      if (params.has('auth')) {
        // Clean the auth param from the URL without a reload
        params.delete('auth');
        const newUrl = params.toString()
          ? `${window.location.pathname}?${params.toString()}`
          : window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }, [refresh]);

    const login = useCallback(() => {
      window.location.href = '/auth/google';
    }, []);

    const logout = useCallback(async () => {
      await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
      setUser(null);
    }, []);

    return (
      <AuthContext.Provider
        value={{ user, isLoading, isAuthenticated: !!user, login, logout, refresh }}
      >
        {children}
      </AuthContext.Provider>
    );
  }

  export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
  }
  ```

  Wrap the app in `AuthProvider` by updating `/home/coole/pickle-tourney-tracker/client/src/main.tsx` (or wherever the root render is). Import `AuthProvider` and wrap `<App />` with it.

- [ ] **Create signup tracking hook: `client/src/hooks/useSignups.ts`**

  Create `/home/coole/pickle-tourney-tracker/client/src/hooks/useSignups.ts`:

  ```typescript
  import { useState, useEffect, useCallback } from 'react';
  import { useAuth } from '../contexts/AuthContext.js';

  export interface Registration {
    id: string;
    tournamentId: string;
    status: 'PENDING' | 'CONFIRMED';
    clickedAt: string;
    confirmedAt: string | null;
    tournament: {
      id: string;
      name: string;
      startDate: string;
      endDate: string;
      city: string;
      state: string;
      imageUrl: string | null;
    };
  }

  export interface ConflictInfo {
    tournamentId: string;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
  }

  export function useSignups() {
    const { isAuthenticated } = useAuth();
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [pending, setPending] = useState<Registration[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchRegistrations = useCallback(async () => {
      if (!isAuthenticated) {
        setRegistrations([]);
        setPending([]);
        return;
      }
      setIsLoading(true);
      try {
        const [allRes, pendingRes] = await Promise.all([
          fetch('/api/signups', { credentials: 'include' }),
          fetch('/api/signups/pending', { credentials: 'include' }),
        ]);
        const allData = await allRes.json() as { registrations: Registration[] };
        const pendingData = await pendingRes.json() as { pending: Registration[] };
        setRegistrations(allData.registrations);
        setPending(pendingData.pending);
      } finally {
        setIsLoading(false);
      }
    }, [isAuthenticated]);

    useEffect(() => {
      void fetchRegistrations();
    }, [fetchRegistrations]);

    const recordClick = useCallback(async (tournamentId: string) => {
      if (!isAuthenticated) return;
      await fetch('/api/signups/click', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId }),
      });
      await fetchRegistrations();
    }, [isAuthenticated, fetchRegistrations]);

    const confirm = useCallback(async (tournamentId: string) => {
      await fetch(`/api/signups/${tournamentId}/confirm`, {
        method: 'PATCH',
        credentials: 'include',
      });
      await fetchRegistrations();
    }, [fetchRegistrations]);

    const decline = useCallback(async (tournamentId: string) => {
      await fetch(`/api/signups/${tournamentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      await fetchRegistrations();
    }, [fetchRegistrations]);

    const checkConflicts = useCallback(async (tournamentId: string): Promise<ConflictInfo[]> => {
      if (!isAuthenticated) return [];
      const res = await fetch(`/api/signups/conflicts/${tournamentId}`, { credentials: 'include' });
      const data = await res.json() as { conflicts: ConflictInfo[] };
      return data.conflicts;
    }, [isAuthenticated]);

    const getStatusForTournament = useCallback(
      (tournamentId: string): 'CONFIRMED' | 'PENDING' | null => {
        const reg = registrations.find((r) => r.tournamentId === tournamentId);
        return reg?.status ?? null;
      },
      [registrations]
    );

    return {
      registrations,
      pending,
      isLoading,
      recordClick,
      confirm,
      decline,
      checkConflicts,
      getStatusForTournament,
      refetch: fetchRegistrations,
    };
  }
  ```

- [ ] **Add login button and user avatar to header: update `DashboardLayout.tsx`**

  Read `/home/coole/pickle-tourney-tracker/client/src/components/layout/DashboardLayout.tsx`.

  Import `useAuth` at the top:
  ```typescript
  import { useAuth } from '../../contexts/AuthContext.js';
  ```

  In the header section, add a login/user area to the right side. When logged out, show a "Sign in with Google" button (use an SVG Google logo inline). When logged in, show the user's avatar (or initials fallback) + name + a logout button/dropdown.

  The Google logo SVG (inline, use this path data for the G icon):
  ```
  <svg viewBox="0 0 24 24" width="16" height="16">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
  ```

  Keep the style changes minimal — just add the auth area to the existing header. Use `useAuth()` for `user`, `isLoading`, `login`, `logout`.

- [ ] **Create RegistrationConfirmPopup component: `client/src/components/signup/RegistrationConfirmPopup.tsx`**

  Create `/home/coole/pickle-tourney-tracker/client/src/components/signup/RegistrationConfirmPopup.tsx`.

  This component shows on every page load for each pending registration. It uses a Dialog (Radix UI) with a queue — shows one pending registration at a time. When the user confirms or declines, it moves to the next pending item automatically.

  Props:
  ```typescript
  interface Props {
    pending: Registration[]; // from useSignups
    onConfirm: (tournamentId: string) => Promise<void>;
    onDecline: (tournamentId: string) => Promise<void>;
  }
  ```

  UX behavior:
  - Show the first item in `pending` as the current dialog
  - After confirming/declining, advance to next item (or close if none left)
  - Show progress indicator if multiple pending: "1 of 3 pending"
  - The dialog title: "Did you register for this tournament?"
  - Show tournament name, date range, and location
  - Two buttons: "Yes, I registered!" (primary green) and "No, remove it" (ghost/destructive)
  - Do NOT show a close/X button — the user must answer yes or no
  - Import `Dialog`, `DialogContent`, `DialogTitle`, `DialogDescription` from `@/components/ui/dialog`
  - Import the `Registration` type from `@/hooks/useSignups`

- [ ] **Create RegisterButton component: `client/src/components/signup/RegisterButton.tsx`**

  Create `/home/coole/pickle-tourney-tracker/client/src/components/signup/RegisterButton.tsx`.

  This replaces the existing register button in cards and modals. It handles all states:

  ```typescript
  interface Props {
    tournamentId: string;
    sourceUrl: string; // the external registration link
    className?: string;
  }
  ```

  Logic:
  - Fetch `useSignups()` for `getStatusForTournament`, `recordClick`, `checkConflicts`
  - Fetch `useAuth()` for `isAuthenticated`, `login`
  - On mount (when `isAuthenticated` is true), call `checkConflicts(tournamentId)` and store result in local state
  - Render based on combined state:

    **Not authenticated**:
    - Normal button: "Register" → clicking opens the external `sourceUrl` in new tab. No signup tracking.

    **Authenticated, status = null, no conflict**:
    - Green "Register →" button
    - On click: `await recordClick(tournamentId)`, then `window.open(sourceUrl, '_blank')`

    **Authenticated, status = null, has conflict**:
    - Amber/warning button with `⚠` icon: "Register (Conflict)"
    - Show a small text below button: "Overlaps with [conflicting tournament name]"
    - On click: same behavior — record click and open URL (don't block, just warn)

    **Authenticated, status = 'PENDING'**:
    - Muted "Registered (pending)" button with a spinner/clock icon
    - Not clickable again (show tooltip: "We'll ask you to confirm next time you visit")

    **Authenticated, status = 'CONFIRMED'**:
    - Filled green "✓ Registered" button, not clickable
    - Small "Visit site →" link below for the external URL

  Use `useAuth` and `useSignups` hooks. Import `Button` from `@/components/ui/button`.

- [ ] **Add registered badge to TournamentCard: update `TournamentCard.tsx`**

  Read `/home/coole/pickle-tourney-tracker/client/src/components/tournament/TournamentCard.tsx`.

  Import `useSignups` and `useAuth`:
  ```typescript
  import { useSignups } from '@/hooks/useSignups.js';
  import { useAuth } from '@/contexts/AuthContext.js';
  ```

  In the card component, get the status:
  ```typescript
  const { isAuthenticated } = useAuth();
  const { getStatusForTournament } = useSignups();
  const status = isAuthenticated ? getStatusForTournament(tournament.id) : null;
  ```

  Add a badge in the top-right corner of the card's image area (use `absolute` positioning):
  - `status === 'CONFIRMED'`: Small green pill badge with checkmark: `✓ Registered`
  - `status === 'PENDING'`: Small yellow pill badge: `⏳ Pending`
  - `null`: nothing

  Badge styling (Tailwind):
  ```
  Confirmed: "absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full bg-green-500 px-2 py-0.5 text-xs font-semibold text-white shadow"
  Pending: "absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full bg-yellow-500 px-2 py-0.5 text-xs font-semibold text-white shadow"
  ```

- [ ] **Wire up RegisterButton in TournamentModal and wire RegistrationConfirmPopup in App**

  1. Read `/home/coole/pickle-tourney-tracker/client/src/components/tournament/TournamentModal.tsx`.
     - Find the existing "Register" button/link.
     - Replace it with `<RegisterButton tournamentId={tournament.id} sourceUrl={tournament.sourceUrl} />`.
     - Import `RegisterButton` from `@/components/signup/RegisterButton`.

  2. Read `/home/coole/pickle-tourney-tracker/client/src/App.tsx`.
     - Import `useSignups`, `RegistrationConfirmPopup`, `useAuth`.
     - Inside the App component, get `pending`, `confirm`, `decline` from `useSignups()`.
     - Render `<RegistrationConfirmPopup pending={pending} onConfirm={confirm} onDecline={decline} />` at the bottom of the JSX (outside the main content, inside the auth context so it renders globally).

  Run `npm run typecheck` from the root to confirm no TypeScript errors.
