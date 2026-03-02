import { Router } from 'express';
const router = Router();
router.get('/status', (_req, res) => {
    res.json({
        authenticated: false,
        message: 'Not authenticated',
    });
});
router.post('/login', (_req, res) => {
    res.status(501).json({
        message: 'Login coming soon',
    });
});
export default router;
//# sourceMappingURL=auth.js.map