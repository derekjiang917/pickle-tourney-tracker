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
