# Railway Deployment Guide

## Environment Variables

Set the following environment variables in your Railway project:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:password@host:5432/dbname?schema=public` |
| `PORT` | Server port (default: 3001) | `3001` |

## Deployment Steps

1. **Create a Railway account** at [railway.app](https://railway.app)

2. **Connect your repository** to Railway

3. **Add a PostgreSQL database**:
   - Go to your project in Railway
   - Click "New" > "Database" > "PostgreSQL"
   - Copy the connection string from the database settings

4. **Configure environment variables**:
   - Go to your project settings
   - Add `DATABASE_URL` with your PostgreSQL connection string
   - Optionally set `PORT` (defaults to 3001)

5. **Deploy**:
   - Railway will automatically detect the `Procfile` and deploy
   - The client builds automatically via the build script

## Project Structure

- **Frontend**: Served from the `/client` folder (Vite build output)
- **Backend**: Runs from the `/server` folder (Express API)
- **Database**: PostgreSQL via Prisma ORM

## Notes

- The root `package.json` includes a `build` script that builds both client and server
- The `Procfile` uses `npm run start:server` which builds the server before starting
- Client assets are served via the Express server in production (configure accordingly)
