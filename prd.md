M# PRD: Migration from Supabase to Prisma-Only Architecture

## Overview

Migrate the ACA Barcode Scanner application from a dual Supabase/Prisma architecture to a Prisma-only setup for Docker deployment. This simplifies the codebase, removes vendor lock-in, and eliminates the incomplete database adapter abstraction layer.

## Goals

1. **Simplify architecture** - Single database layer using Prisma
2. **Remove Supabase dependency** - No Supabase packages or configuration required
3. **Maintain all functionality** - No feature regression
4. **Docker-first deployment** - Self-hosted PostgreSQL + Next.js container

## Current State

### Database Setup
- **Prisma schema**: Complete (`prisma/schema.prisma`) - 13 models defined
- **NextAuth**: Already configured with Prisma (`src/lib/auth/nextauth-config.ts`)
- **Adapter layer**: Exists but unused by 95% of codebase (`src/lib/db/`)

### Dependencies to Remove
```json
{
  "@supabase/ssr": "^0.8.0",
  "@supabase/supabase-js": "^2.90.1"
}
```

### Files Using Supabase Directly (45 files)

#### Admin Dashboard Pages (9 files)
| File | Current Import |
|------|----------------|
| `src/app/admin/(dashboard)/students/page.tsx` | `@/lib/supabase/client` |
| `src/app/admin/(dashboard)/students/[id]/page.tsx` | `@/lib/supabase/client` |
| `src/app/admin/(dashboard)/students/new/page.tsx` | `@/lib/supabase/client` |
| `src/app/admin/(dashboard)/parents/page.tsx` | `@/lib/supabase/client` |
| `src/app/admin/(dashboard)/parents/[id]/page.tsx` | `@/lib/supabase/client` |
| `src/app/admin/(dashboard)/parents/new/page.tsx` | `@/lib/supabase/client` |
| `src/app/admin/(dashboard)/transactions/page.tsx` | `@/lib/supabase/client` |
| `src/app/admin/(dashboard)/add-payment/page.tsx` | `@/lib/supabase/client` |
| `src/app/admin/(dashboard)/meal-stats/page.tsx` | `@/lib/supabase/client` |

#### Settings Components (9 files)
| File | Current Import |
|------|----------------|
| `src/app/admin/(dashboard)/settings/context/SettingsContext.tsx` | `@/lib/supabase/client` |
| `src/app/admin/(dashboard)/settings/components/tabs/DataTab.tsx` | `@/lib/supabase/client` |
| `src/app/admin/(dashboard)/settings/components/tabs/AdminsTab.tsx` | `@/lib/supabase/client` |
| `src/app/admin/(dashboard)/settings/components/tabs/CalendarTab.tsx` | `@/lib/supabase/client` |
| `src/app/admin/(dashboard)/settings/components/tabs/CommunicationsTab.tsx` | `@/lib/supabase/client` |
| `src/app/admin/(dashboard)/settings/components/tabs/EmailTab.tsx` | `@/lib/supabase/client` |
| `src/app/admin/(dashboard)/settings/components/tabs/PaymentsTab.tsx` | `@/lib/supabase/client` |
| `src/app/admin/(dashboard)/settings/components/tabs/DataExportTab.tsx` | `@/lib/supabase/client` |

#### Admin Components (3 files)
| File | Current Import |
|------|----------------|
| `src/components/admin/SchoolCalendarSettings.tsx` | `@/lib/supabase/client` |
| `src/components/admin/CsvImport.tsx` | `@/lib/supabase/client` |
| `src/components/admin/AdminNav.tsx` | `@/lib/supabase/client` |

#### API Routes - Admin (10 files)
| File | Current Import |
|------|----------------|
| `src/app/api/admin/sync-calendar/route.ts` | `@/lib/supabase/server` |
| `src/app/api/admin/school-calendar-status/route.ts` | `@/lib/supabase/server` |
| `src/app/api/admin/blackout-periods/route.ts` | `@/lib/supabase/server` |
| `src/app/api/admin/test-email/route.ts` | `@/lib/supabase/server` |
| `src/app/api/admin/send-receipt/route.ts` | `@/lib/supabase/server` |
| `src/app/api/admin/send-balance-email/route.ts` | `@/lib/supabase/server` |
| `src/app/api/admin/cash-payment/route.ts` | `@/lib/supabase/server` |

#### API Routes - Parent Portal (4 files)
| File | Current Import |
|------|----------------|
| `src/app/api/parent-portal/generate-token/route.ts` | `@/lib/supabase/server` |
| `src/app/api/parent-portal/create-payment/route.ts` | `@/lib/supabase/server` |
| `src/app/api/parent-portal/request-link/route.ts` | `@/lib/supabase/server` |
| `src/app/api/parent-portal/validate/[token]/route.ts` | `@/lib/supabase/server` |

#### API Routes - Cron (2 files)
| File | Current Import |
|------|----------------|
| `src/app/api/cron/sync-calendar/route.ts` | `@supabase/supabase-js` (service key) |
| `src/app/api/cron/send-low-balance-emails/route.ts` | `@supabase/supabase-js` (service key) |

#### Library Files (5 files)
| File | Current Import |
|------|----------------|
| `src/lib/supabase.ts` | `@supabase/supabase-js` |
| `src/lib/supabase/client.ts` | `@supabase/ssr` |
| `src/lib/supabase/server.ts` | `@supabase/ssr` |
| `src/lib/supabase/middleware.ts` | `@supabase/ssr` |
| `src/lib/school-calendar.ts` | `@supabase/supabase-js` |

#### Auth Files (2 files)
| File | Current Import |
|------|----------------|
| `src/lib/auth/client.ts` | `@/lib/supabase/client` |
| `src/lib/auth/supabase-adapter.ts` | `@/lib/supabase/server` |

#### Other Files (3 files)
| File | Current Import |
|------|----------------|
| `src/middleware.ts` | Supabase middleware |
| `src/lib/csvImport.ts` | `@/lib/supabase` |
| `src/components/ScanResult.tsx` | `@/lib/supabase` |

### Files to Delete After Migration
```
src/lib/supabase.ts
src/lib/supabase/client.ts
src/lib/supabase/server.ts
src/lib/supabase/middleware.ts
src/lib/db/index.ts
src/lib/db/supabase-adapter.ts
src/lib/db/prisma-adapter.ts
src/lib/db/types.ts
src/lib/auth/supabase-adapter.ts
```

## Technical Requirements

### Prisma Schema
Already complete with all 13 models:
- `Parent`
- `Student`
- `AdminUser`
- `AdminInvitation`
- `AppSettings`
- `BalanceTransaction`
- `NotificationLog`
- `DailyMeal`
- `EmailBlackoutPeriod`
- `ParentAccessToken`
- `PendingPayment`

Plus enums: `SchoolLevel`, `AdminRole`, `TransactionType`, `EmailProvider`, `DayOfWeek`, `AutoSendSchedule`, `MealSource`, `PendingPaymentStatus`

### Authentication
NextAuth v5 already configured with:
- Credentials provider using Prisma
- JWT session strategy
- Admin role support (`admin`, `super_admin`)

### Migration Pattern

**Client Components** cannot use Prisma directly (it's server-only). Two approaches:

1. **Server Actions** (Recommended for mutations)
   ```typescript
   // src/actions/students.ts
   'use server'
   import prisma from '@/lib/prisma'

   export async function getStudents() {
     return prisma.student.findMany({ orderBy: { name: 'asc' } })
   }
   ```

2. **API Routes** (For complex operations or external access)
   ```typescript
   // src/app/api/students/route.ts
   import prisma from '@/lib/prisma'

   export async function GET() {
     const students = await prisma.student.findMany()
     return Response.json(students)
   }
   ```

### Cron Jobs
Convert from Vercel cron to Docker-based scheduling:

**Option A: node-cron in Next.js**
```typescript
// src/lib/cron.ts
import cron from 'node-cron'

cron.schedule('0 7 * * 1-5', async () => {
  await sendLowBalanceEmails()
})
```

**Option B: Separate cron container**
```yaml
# docker-compose.yml
cron:
  image: node:20-alpine
  command: node /app/cron.js
  volumes:
    - ./cron:/app
```

**Option C: External scheduler (Ofelia, supercronic)**

## Migration Phases

### Phase 1: Server Actions Foundation
Create server actions for all database operations:
```
src/actions/
├── students.ts      # CRUD for students
├── parents.ts       # CRUD for parents
├── transactions.ts  # Transaction operations
├── settings.ts      # App settings
├── meals.ts         # Daily meals
├── notifications.ts # Notification log
└── admin.ts         # Admin user management
```

### Phase 2: Admin Dashboard Pages
Migrate pages to use server actions:
1. `students/page.tsx` - List students
2. `students/[id]/page.tsx` - Student detail
3. `students/new/page.tsx` - Create student
4. `parents/page.tsx` - List parents
5. `parents/[id]/page.tsx` - Parent detail
6. `parents/new/page.tsx` - Create parent
7. `transactions/page.tsx` - Transaction list
8. `add-payment/page.tsx` - Add payment form
9. `meal-stats/page.tsx` - Meal statistics

### Phase 3: Settings System
Migrate settings tabs:
1. `SettingsContext.tsx` - Central settings state
2. `DataTab.tsx` - Data management
3. `AdminsTab.tsx` - Admin users
4. `CalendarTab.tsx` - Calendar settings
5. `CommunicationsTab.tsx` - Communication settings
6. `EmailTab.tsx` - Email configuration
7. `PaymentsTab.tsx` - Payment settings
8. `DataExportTab.tsx` - Export functionality

### Phase 4: Components
Migrate shared components:
1. `AdminNav.tsx` - Navigation (uses auth)
2. `CsvImport.tsx` - CSV import logic
3. `SchoolCalendarSettings.tsx` - Calendar config
4. `ScanResult.tsx` - Scanner result display

### Phase 5: API Routes
Convert API routes to use Prisma directly:
1. Admin routes (7 files)
2. Parent portal routes (4 files)
3. Auth routes

### Phase 6: Cron & Utilities
1. Convert cron routes to scheduled tasks
2. Update `csvImport.ts`
3. Update `school-calendar.ts`

### Phase 7: Cleanup
1. Delete Supabase library files
2. Delete database adapter layer
3. Remove Supabase packages from `package.json`
4. Update middleware for auth-only
5. Remove unused environment variables

## Environment Variables

### Remove
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_PROVIDER
```

### Keep/Add
```
DATABASE_URL=postgresql://user:pass@localhost:5432/aca_lunch
NEXTAUTH_SECRET=<generated-secret>
NEXTAUTH_URL=http://localhost:3000
```

## Testing Requirements

### Unit Tests
- Server actions return correct data
- Prisma queries are correct

### Integration Tests
- Auth flow works (login, logout, session)
- CRUD operations for all entities
- Settings persistence
- CSV import/export

### E2E Tests
- Scanner workflow
- Admin dashboard navigation
- Parent portal flow
- Payment processing

## Deployment

### Docker Compose (Production)
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/aca_lunch
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=aca_lunch

volumes:
  postgres_data:
```

### Dockerfile
```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
RUN npx prisma generate

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["node", "server.js"]
```

## Success Criteria

1. All Supabase imports removed
2. All pages functional with Prisma
3. Authentication works via NextAuth
4. Cron jobs execute on schedule
5. Docker deployment works
6. No runtime errors referencing Supabase
7. `npm run build` succeeds without Supabase packages

## Phase 8: Docker Infrastructure

### Current Docker Files
| File | Purpose | Action |
|------|---------|--------|
| `docker-compose.yml` | Supabase Cloud deployment | Delete |
| `docker-compose.selfhosted.yml` | Full Supabase self-hosted | Delete |
| `docker-compose.prisma.yml` | Prisma/PostgreSQL | Rename to `docker-compose.yml` |
| `Dockerfile` | Multi-stage build | Refine |

### Production Docker Compose (`docker-compose.yml`)

Refinements needed for the current `docker-compose.prisma.yml`:

1. **Add automatic migrations** - Run `prisma migrate deploy` on startup
2. **Add Caddy for HTTPS** - Uncomment and configure properly
3. **Add backup service** - PostgreSQL backup cron
4. **Environment file** - Create `.env.production.example`
5. **Resource limits** - Add memory/CPU limits
6. **Logging** - Configure log rotation
7. **Network isolation** - Internal network for db

```yaml
# Target production docker-compose.yml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/lunch_scanner
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
    depends_on:
      db:
        condition: service_healthy
      migrations:
        condition: service_completed_successfully
    deploy:
      resources:
        limits:
          memory: 512M
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=lunch_scanner
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 256M
    restart: unless-stopped
    networks:
      - internal

  migrations:
    build: .
    command: npx prisma migrate deploy
    environment:
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/lunch_scanner
    depends_on:
      db:
        condition: service_healthy
    networks:
      - internal

  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
    depends_on:
      - app
    restart: unless-stopped

  backup:
    image: postgres:16-alpine
    volumes:
      - ./backups:/backups
    environment:
      - PGPASSWORD=${POSTGRES_PASSWORD}
    command: >
      sh -c 'while true; do
        pg_dump -h db -U postgres lunch_scanner > /backups/backup_$$(date +%Y%m%d_%H%M%S).sql
        find /backups -mtime +7 -delete
        sleep 86400
      done'
    depends_on:
      - db
    networks:
      - internal

volumes:
  postgres_data:
  caddy_data:

networks:
  internal:
  default:
```

### Development Docker Compose (`docker-compose.dev.yml`)

For local development with hot reload:

```yaml
# docker-compose.dev.yml
services:
  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_PASSWORD=devpassword
      - POSTGRES_DB=lunch_scanner_dev
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 5

  # Optional: pgAdmin for database management
  pgadmin:
    image: dpage/pgadmin4:latest
    ports:
      - "5050:80"
    environment:
      - PGADMIN_DEFAULT_EMAIL=admin@localhost.com
      - PGADMIN_DEFAULT_PASSWORD=admin
      - PGADMIN_CONFIG_SERVER_MODE=False
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    depends_on:
      - db
    profiles:
      - tools

volumes:
  postgres_dev_data:
  pgadmin_data:
```

**Local dev workflow:**
```bash
# Start database only
docker compose -f docker-compose.dev.yml up -d

# Run Next.js locally with hot reload
npm run dev

# Optional: Start pgAdmin
docker compose -f docker-compose.dev.yml --profile tools up -d
```

### Dockerfile Refinements

Current Dockerfile is good but needs:

1. **Entrypoint script** - Handle migrations + startup
2. **Build args** - For different environments
3. **Smaller image** - Remove unnecessary files

```dockerfile
# Add entrypoint script
COPY --chmod=755 docker-entrypoint.sh ./
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
```

```bash
#!/bin/sh
# docker-entrypoint.sh

# Run migrations if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
  echo "Running database migrations..."
  npx prisma migrate deploy
fi

# Execute the main command
exec "$@"
```

### Files to Create
- `docker-compose.dev.yml` - Local development
- `docker-entrypoint.sh` - Container entrypoint
- `.env.production.example` - Production env template
- `.env.development.example` - Development env template
- `Caddyfile` - Caddy configuration for HTTPS

### Files to Delete
- `docker-compose.yml` (current Supabase Cloud version)
- `docker-compose.selfhosted.yml`
- `Caddyfile.selfhosted` (if exists)
- `docker/` directory (Supabase init scripts)

## Phase 9: Missing Supabase Items

### 9.1 `public_settings` View (Critical)

The scanner page uses a `public_settings` view in `src/lib/supabase.ts` to expose only non-sensitive settings (pricing info) to unauthenticated users. This view is **not defined** in any migration.

**Current Code (src/lib/supabase.ts:85-91):**
```typescript
const { data, error } = await supabase
  .from('public_settings' as 'app_settings')
  .select('elementary_lunch_price, highschool_lunch_price, ...')
  .eq('id', 1)
  .single()
```

**Solution:** Refactor `getSettings()` in `src/lib/supabase.ts` to use a Prisma server action that selects only the public fields. The scanner page (`src/app/page.tsx`) should call this action.

**Files to Update:**
- `src/actions/settings.ts` - Add `getPublicSettings()` action
- `src/app/page.tsx` - Use new action instead of Supabase
- `src/components/ScanResult.tsx` - Use new action if needed

### 9.2 Row Level Security (RLS) - Not Needed

The `docker/volumes/db/init.sql` defines 15+ RLS policies. With Prisma:
- **RLS is NOT needed** - NextAuth handles authorization at the application layer
- **No migration work required** - just documentation
- Security is enforced via NextAuth middleware and session checks in API routes

### 9.3 Realtime Subscriptions - Not Used

The init.sql enables realtime for `students`, `parents`, `balance_transactions`:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE students;
```

**Status:** No frontend code uses `.subscribe()` or realtime channels.
**Action:** No migration work needed - document only.

### 9.4 Database Triggers

The init.sql defines `update_updated_at_column()` trigger for `app_settings` and `daily_meals`.

**Solution:** Prisma's `@updatedAt` directive handles this automatically:
```prisma
model AppSettings {
  updatedAt DateTime @updatedAt @map("updated_at")
}
```

**Action:** Verify Prisma schema has `@updatedAt` on relevant models.

### 9.5 PostgreSQL Extensions

The init.sql requires:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

**Solution:** Document in deployment requirements. Prisma uses `gen_random_uuid()` (pgcrypto) by default:
```prisma
id String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
```

### 9.6 Service Role Key Authentication

Cron jobs use `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS.

**Solution:** With Prisma (no RLS), cron jobs authenticate via:
- Vercel cron secret header (`CRON_SECRET`)
- Or internal network isolation in Docker

**Already handled** in Phase 6 migration.

### 9.7 Missing File from PRD

`src/lib/auth/index.ts` references Supabase but was not in the original file list.

**Action:** Add to Phase 7 cleanup or verify it's Supabase-free.

### 9.8 Test/Seed Data

`supabase/migrations/001_create_tables.sql` contains test data inserts.

**Solution:** Create `prisma/seed.ts` for development seeding:
```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Seed test parents and students
}

main()
```

Update `package.json`:
```json
"prisma": {
  "seed": "ts-node prisma/seed.ts"
}
```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Data loss during migration | Not applicable - schema only, data migration is separate |
| Auth breakage | NextAuth already configured with Prisma |
| Missing Prisma queries | Supabase adapter shows all needed operations |
| Performance regression | Prisma is equally performant; add indexes as needed |
