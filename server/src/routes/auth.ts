import { Router, Request, Response, NextFunction } from 'express';

const router = Router();

router.get('/status', (_req: Request, res: Response) => {
  res.json({
    authenticated: false,
    message: 'Not authenticated',
  });
});

router.post('/login', (_req: Request, res: Response) => {
  res.status(501).json({
    message: 'Login coming soon',
  });
});

export default router;
