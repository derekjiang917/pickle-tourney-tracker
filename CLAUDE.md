# Project Overview

pickle-tourney-tracker - A web application that aggregates pickleball tournaments.

## Architecture

- **Monorepo** with npm workspaces
- **Client**: Vite + React + TypeScript (strict mode)
- **Server**: Express + TypeScript (strict mode)

## Project Structure

```
/client          # Vite React application
  /src          # React components and pages
  vite.config.ts
  tsconfig.json
/server          # Express API
  /src          # API routes and controllers
  tsconfig.json
package.json     # Root workspace config
```

## Commands

- `npm run dev` - Start both client and server
- `npm run dev:client` - Start client only
- `npm run dev:server` - Start server only
- `npm run build` - Build both client and server
- `npm run typecheck` - Run TypeScript type checking

## Tech Stack

- React 18
- Vite 5
- Express 4
- TypeScript 5 (strict mode)
- Tailwind CSS (for styling)
