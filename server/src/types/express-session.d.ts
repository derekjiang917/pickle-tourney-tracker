import 'express-session';

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
