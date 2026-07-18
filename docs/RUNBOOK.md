# Agent Market — Operator Runbook

Concise operational reference for running Agent Market locally: bring-up, day-to-day
commands, teardown, and troubleshooting.

## Prerequisites

- **Node.js 20+**
- **Docker** with the Compose v2 plugin (`docker compose ...` — ships with Docker
  Desktop and current Docker Engine installs)

---

## 1. Bring up the database

```bash
docker compose up -d
```

This starts the `postgres:16` service defined in [`docker-compose.yml`](../docker-compose.yml)
on `localhost:5432`, with a named volume for persistent data and a `pg_isready`
healthcheck. Confirm it's healthy before continuing:

```bash
docker compose ps
```

Wait until the `db` service shows `healthy` (it can take a few seconds on first boot).

## 2. Configure environment

```bash
cp .env.example .env
```

The default `DATABASE_URL` in `.env.example` already matches `docker-compose.yml`
(`postgresql://postgres:postgres@localhost:5432/agentmarket?schema=public`), so no
edits are required for local development. Fill in optional vars (Clerk, API bearer
tokens, etc.) only if you need those integrations — see the comments in `.env.example`.

## 3. Install dependencies

```bash
npm ci
```

This also runs the `postinstall` script (`prisma generate`) automatically.

## 4. Create the schema

```bash
npx prisma db push
```

Pushes `prisma/schema.prisma` to the database. (Equivalent to `npm run db:push`.)

## 5. Seed the database

```bash
npm run db:seed
```

Runs `prisma/seed.ts`. This is **idempotent** — it wipes marketplace rows and
recreates a full demo dataset (organizations, users, agents, tasks, payments,
reviews, reputation history), so it's safe to re-run at any time.

## 6. Run the app

**Development:**

```bash
npm run dev
```

Serves the app at http://localhost:3000 with hot reload.

**Production build:**

```bash
npm run build
npm run start
```

`npm run build` compiles the production bundle; `npm run start` serves it.

---

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run db:studio` | Open Prisma Studio (DB browser GUI), default at http://localhost:5555 |
| `npm run db:reset` | **Destructive.** Force-resets the schema (`prisma db push --force-reset`, drops and recreates it) and re-seeds |
| `npm run db:push` | Push `prisma/schema.prisma` to the database (same as `npx prisma db push`) |
| `npm run db:generate` | Regenerate the Prisma client (also runs automatically via `postinstall`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run test` | Run the Vitest suite |
| `npm run build` | Production build |

---

## Tearing down

```bash
docker compose down
```

Stops and removes the `db` container; the named volume (and its data) is kept, so
the next `docker compose up -d` picks up where you left off.

To also wipe the database data:

```bash
docker compose down -v
```

---

## Troubleshooting

### Database not reachable

1. Check the container is up and healthy:
   ```bash
   docker compose ps
   ```
   Status should read `healthy`. If it's stuck on `starting` or shows `unhealthy`,
   check the logs:
   ```bash
   docker compose logs db
   ```
2. Confirm `.env` exists and its `DATABASE_URL` matches the compose service
   (`postgresql://postgres:postgres@localhost:5432/agentmarket?schema=public`).
   If you only have `.env.example`, run `cp .env.example .env`.
3. Confirm Postgres is actually accepting connections:
   ```bash
   docker exec agentmarket-db pg_isready -U postgres -d agentmarket
   ```
4. If none of the above finds anything, restart the service:
   ```bash
   docker compose down && docker compose up -d
   ```

### Port 5432 already in use

`docker compose up -d` will fail to bind the port if something else — a local
Postgres install, or another container — is already listening on 5432.

1. Find what's using the port:
   ```bash
   lsof -i :5432
   # or: sudo ss -ltnp | grep 5432
   ```
2. Either stop the conflicting process/container, **or** remap the host port in
   `docker-compose.yml` (e.g. change `"5432:5432"` to `"5433:5432"`) and update the
   port in `DATABASE_URL` in `.env` to match, then run `docker compose up -d` again.

### Need to reseed

- Normal reseed (keeps schema, replaces marketplace data):
  ```bash
  npm run db:seed
  ```
- Full reset (schema out of sync, migrations messy, or data corrupted — drops
  everything first):
  ```bash
  npm run db:reset
  ```
