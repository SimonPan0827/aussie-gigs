# Aussie Gigs

A full-stack web app for browsing Australian music gigs, artists, and venues.

## Tech Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: FastAPI, SQLAlchemy, Alembic
- Database: PostgreSQL
- Containerization: Docker, Docker Compose

## Project Structure

```text
frontend/          Next.js app
backend/           FastAPI app
backend/alembic/   Database migrations
docker-compose.yml Local Docker setup
```

## Run With Docker

Start the full app, including PostgreSQL:

```bash
docker compose up --build
```

Then open:

```text
http://localhost:3000
```

API health check:

```text
http://localhost:8000
```

## Local Development

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Backend:

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

For local backend development, set `DATABASE_URL` to your PostgreSQL database.

## Database

Docker Compose runs PostgreSQL and automatically starts the backend after applying migrations:

```bash
alembic upgrade head
```

Event, artist, venue, and ticket data can be imported from Ticketmaster:

```bash
curl -X POST "http://localhost:8000/integrations/ticketmaster/sync-catalog?state_code=VIC&size=100"
```

Upcoming Ticketmaster events can also be synced manually:

```bash
curl -X POST "http://localhost:8000/integrations/ticketmaster/sync-upcoming?state_code=VIC&size=100"
```

Docker Compose also starts a `ticketmaster-sync` worker. It runs the upcoming
Ticketmaster sync for every Australian state and territory every 24 hours. Each
run writes a log row that can be checked with:

```bash
curl "http://localhost:8000/integrations/sync-logs?source=ticketmaster"
```

In production, `.github/workflows/scheduled-imports.yml` runs scheduled import
jobs once per day through GitHub Actions. It currently syncs Ticketmaster
upcoming events and expects these repository secrets:

```text
DATABASE_URL
TICKETMASTER_API_KEY
```

Optional repository variables:

```text
TICKETMASTER_SYNC_STATES=ACT,NSW,NT,QLD,SA,TAS,VIC,WA
TICKETMASTER_SYNC_PAGE_SIZE=100
```
