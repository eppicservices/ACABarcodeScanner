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

---

# Development Backlog

**Source**: [ACA Barcode Scanner - Monday Board](https://shepherdsglobal.monday.com/boards/18395942198)
**Board ID**: 18395942198
**Workspace**: Curtis's Workspace (ID: 13943256)
**Last Synced**: 2026-01-22

## Scanner Page

### Add admin link to Scanner page
Add an admin link to the Scanner page for quick access to administration features.

**Context:**
- The Scanner page is the main interface used during lunch service
- Admin staff need quick access to admin dashboard without navigating away
- Link should be subtle but accessible (e.g., gear icon or 'Admin' text link)

**Technical Details:**
- File: Scanner page component (likely in /src/app/ root or dedicated scanner route)
- The admin dashboard is at /admin/
- Should respect authentication state - only show if user has admin access

**Acceptance Criteria:**
- Admin link visible on Scanner page
- Link navigates to /admin/ dashboard
- Mobile-friendly placement

**Subtasks:**
- [ ] Determine optimal placement for admin link (header vs corner)
- [ ] Add admin link component with gear icon
- [ ] Test admin link on mobile and desktop views

---

## Settings & Performance

### Fix price input box sizing in Settings
Fix CSS issues in the Settings page - the price input boxes have sizing problems.

**Context:**
- Located in: /src/app/admin/(dashboard)/settings/page.tsx
- Pricing Tab component: /src/app/admin/(dashboard)/settings/components/tabs/PricingTab.tsx
- Input boxes for lunch prices (elementary, high school, lunch cards) display incorrectly

**Technical Details:**
- Check CSS-in-JS styles in the component
- May need width constraints or flexbox adjustments
- Consider responsive breakpoints for mobile vs desktop

**Acceptance Criteria:**
- Price input boxes are properly sized on desktop
- Price input boxes are properly sized on mobile
- Consistent styling with other form inputs in Settings

**Subtasks:**
- [ ] Inspect current CSS in PricingTab.tsx component
- [ ] Fix input width and padding styles
- [ ] Test responsive behavior on mobile breakpoints

---

### Investigate and fix slow School Calendar load time
Investigate why the School Calendar takes so long to load. Look for optimization opportunities.

**Context:**
- Calendar settings in: /src/app/admin/(dashboard)/settings/components/tabs/CalendarTab.tsx
- Calendar component: /src/components/admin/SchoolCalendarSettings.tsx (20.5KB - large file)
- Uses Google Calendar integration for meal planning and email scheduling
- Related API: /api/admin/sync-calendar and /api/admin/school-calendar-status

**Possible Issues:**
- Excessive API calls to Google Calendar on each load
- Large data sets being fetched without pagination
- Missing caching for calendar data
- Inefficient queries or data transformations
- Synchronous blocking operations

**Technical Investigation Areas:**
1. Check network requests in browser dev tools
2. Profile component render time
3. Review data fetching patterns in SchoolCalendarSettings.tsx
4. Check if calendar data is being cached (settings use configurable TTL)

**Acceptance Criteria:**
- Calendar loads in under 2 seconds
- No unnecessary re-fetches on tab switches
- Loading state shown during data fetch

**Subtasks:**
- [ ] Profile network requests using browser dev tools
- [ ] Review SchoolCalendarSettings.tsx data fetching patterns
- [ ] Implement caching for calendar data if missing
- [ ] Add loading skeleton/spinner during fetch
- [ ] Test and verify load time improvement

---

## Transactions Module

### Fix unwanted scroll-to-top bug on Transactions page (mobile)
Bug: On mobile, the Transactions page forces the screen to scroll back up unexpectedly.

**Context:**
- File: /src/app/admin/(dashboard)/transactions/page.tsx
- Issue occurs on mobile devices when scrolling through transaction list
- May be related to state updates, re-renders, or focus management

**Possible Causes:**
1. useEffect dependency causing re-render and scroll reset
2. Pagination or infinite scroll implementation issue
3. Filter/sort changes triggering scroll to top
4. Element gaining focus that scrolls into view
5. State update causing list re-mount

**Acceptance Criteria:**
- Users can scroll through transactions without unexpected jumps
- Scroll position maintained during data updates
- Filter/sort changes don't reset scroll unexpectedly

**Subtasks:**
- [ ] Reproduce bug and identify scroll trigger
- [ ] Check useEffect hooks for re-render issues
- [ ] Fix scroll position preservation
- [ ] Test fix on multiple mobile devices

---

### Create Transaction Detail view
Create a new Transaction Detail view page that shows full details of a selected transaction.

**Context:**
- Currently transactions are shown in a table/list format
- Need a dedicated detail page for viewing complete transaction information
- Route would be: /admin/transactions/[id]

**Technical Details:**
- Create new page: /src/app/admin/(dashboard)/transactions/[id]/page.tsx
- Fetch transaction by ID with related student and parent data
- Use balance_transactions table with joins to students and parents

**Data to Display:**
- Transaction ID and timestamp
- Transaction type (payment, lunch_card, adjustment, lunch_used)
- Student name with link to student detail
- Parent name with link to parent detail
- Amount paid / lunches changed
- Balance before and after
- Notes field
- Created by (admin user)

**Acceptance Criteria:**
- Detail page accessible from transaction list
- All transaction fields displayed clearly
- Navigation back to list
- Links to related student/parent records

**Subtasks:**
- [ ] Create route file /admin/transactions/[id]/page.tsx
- [ ] Fetch transaction with student/parent joins
- [ ] Build detail view UI with all transaction fields
- [ ] Add navigation links to related records
- [ ] Add clickable rows in transaction list to open detail

---

### Mobile optimize Transaction Detail view
Ensure the new Transaction Detail view is fully optimized for mobile devices.

**Context:**
- Depends on: Create Transaction Detail view task
- Mobile users (likely admin staff on phones) need to view transaction details
- Should follow same responsive patterns as other detail pages

**Technical Details:**
- Use CSS media queries or Tailwind responsive classes
- Stack layout vertically on mobile
- Ensure touch targets are large enough (44px minimum)
- Test on various screen sizes (320px - 768px)

**Acceptance Criteria:**
- Readable on screens as small as 320px wide
- No horizontal scrolling required
- Touch-friendly navigation and links
- Consistent with other mobile views in the app

**Subtasks:**
- [ ] Add responsive CSS media queries for mobile
- [ ] Implement stacked card layout for small screens
- [ ] Test on 320px, 375px, and 768px viewports

---

### Add search filter to Transactions table
Add a search filter to the Transactions table view that allows searching for parents, students, etc.

**Context:**
- File: /src/app/admin/(dashboard)/transactions/page.tsx
- Currently has type filters (All, Payments, Lunch Cards, Used, Adjustments)
- Need text-based search across multiple fields

**Technical Details:**
- Add search input component above or beside existing filters
- Search should query: student name, parent name, transaction notes
- Implement debounced search (300-500ms delay)
- Filter client-side for small datasets, server-side for large

**Acceptance Criteria:**
- Search input visible and accessible
- Results filter in real-time as user types
- Clear button to reset search
- Works in combination with existing type filters
- Mobile-friendly input sizing

**Subtasks:**
- [ ] Add search input component to Transactions page
- [ ] Implement debounced search with 300ms delay
- [ ] Filter by student name, parent name, and notes
- [ ] Add clear search button

---

### Clean up mobile stats bar on Transactions page
Clean up and optimize the stats bar layout on the Transactions page for mobile devices.

**Context:**
- File: /src/app/admin/(dashboard)/transactions/page.tsx
- Stats bar shows: Lunches Added, Lunches Used, Total Transactions
- Current layout may be cramped or misaligned on mobile

**Acceptance Criteria:**
- Stats readable on 320px wide screens
- No overlapping or truncated text
- Consistent spacing and alignment
- Visual hierarchy maintained

**Subtasks:**
- [ ] Review current stats bar CSS and layout
- [ ] Implement stacked or compact grid layout for mobile
- [ ] Test stats readability on small screens

---

## Parents Module

### Fix Add Student button in Parents table
Fix the Add Student button - currently not functioning properly in the Parents table view.

**Context:**
- File: /src/app/admin/(dashboard)/parents/page.tsx
- Button should open a form/modal to add a new student linked to the selected parent
- May be opening wrong modal, not passing parent ID, or event handler broken

**Expected Behavior:**
- Click Add Student on a parent row
- Form opens pre-filled with parent relationship
- New student is created and linked to parent
- Table refreshes showing new student count

**Acceptance Criteria:**
- Add Student button responds to click
- Form opens with correct parent context
- Student successfully created and linked
- UI updates after successful creation

**Subtasks:**
- [ ] Debug onClick handler for Add Student button
- [ ] Verify parent ID is passed to student form
- [ ] Fix modal/form opening logic
- [ ] Test student creation with parent link

---

### Fix Add Payment button in Parents table
Fix the Add Payment button - currently not functioning properly in the Parents table view.

**Context:**
- File: /src/app/admin/(dashboard)/parents/page.tsx
- Button should open payment form for selected parent's students
- Related: /admin/add-payment page exists for payment entry

**Acceptance Criteria:**
- Add Payment button responds to click
- Form shows correct parent and their students
- Payment successfully processed
- Balance updates reflected in UI

**Subtasks:**
- [ ] Debug onClick handler for Add Payment button
- [ ] Verify parent/student IDs passed correctly
- [ ] Fix navigation or modal logic
- [ ] Test payment flow end-to-end

---

### Fix mobile layout for Sort/Filter controls in Parents table
On mobile, move the Sort and Active Only filter to the same line, or find a better layout solution.

**Context:**
- File: /src/app/admin/(dashboard)/parents/page.tsx
- Filter controls take too much vertical space on mobile
- Sort dropdown and Active Only toggle should be more compact

**Acceptance Criteria:**
- Sort and Active Only on same line on mobile
- Controls remain usable and tappable
- No horizontal overflow
- Consistent with Students table filter layout

**Subtasks:**
- [ ] Review current filter controls CSS layout
- [ ] Implement inline flexbox layout for Sort + Active toggle
- [ ] Test on mobile devices and viewports

---

### Mobile optimize Parent Detail page
Optimize the Parent Detail page for mobile devices.

**Context:**
- File: /src/app/admin/(dashboard)/parents/[id]/page.tsx
- Individual parent profile showing contact info, students list, balance info
- Desktop layout may not translate well to mobile

**Acceptance Criteria:**
- Page readable on 320px screens
- No horizontal scrolling
- All buttons easily tappable
- Information hierarchy maintained
- Consistent with other detail pages

**Subtasks:**
- [ ] Add responsive CSS breakpoints for mobile
- [ ] Stack parent info and students list vertically
- [ ] Ensure action buttons are touch-friendly (44px min)
- [ ] Test on 320px, 375px, 768px viewports

---

### Add ability to create/add kids from Add Parent form
Add functionality to create or add children (students) at the same time as creating a parent.

**Context:**
- Current flow requires: Create Parent -> Navigate to parent -> Add Student
- Requested flow: Create Parent with 1+ students in single form
- Common use case: New family registration with multiple kids

**Technical Details:**
- Modify Add Parent form/modal to include student fields
- Add "Add Another Student" button for multiple children
- Students table: id, parent_id, name, barcode, school_level, balance
- Need to handle transaction: create parent, then create students with parent_id

**Acceptance Criteria:**
- Add Parent form has student section
- Can add 1 or more students
- Parent and students created atomically
- Validation for required fields
- Error handling for partial failures

**Subtasks:**
- [ ] Design multi-student form UI with add/remove buttons
- [ ] Add student fields: name, school_level, barcode
- [ ] Implement atomic transaction: create parent then students
- [ ] Add form validation for required fields
- [ ] Test with multiple students creation

---

### Remove Home Address from Parent form and info
Remove the Home Address field from both the Add Parent form and the Parent Info display section.

**Context:**
- Parents table has 'address' column that stores home address
- This field is no longer needed/wanted in the UI
- Should be removed from both form input and display views

**Technical Details:**
- File: /src/app/admin/(dashboard)/parents/page.tsx (list view)
- File: /src/app/admin/(dashboard)/parents/[id]/page.tsx (detail view)
- Keep database column for now (data migration separate)

**Acceptance Criteria:**
- No address field in Add/Edit Parent forms
- No address displayed in Parent Detail
- Existing address data preserved in DB
- No console errors from removed field

**Subtasks:**
- [ ] Remove address field from Add Parent form
- [ ] Remove address from Parent Detail display
- [ ] Verify no console errors from removed field

---

### Remove phone number from Parents table desktop view
Remove the phone number column from the desktop view of the Parents table.

**Context:**
- File: /src/app/admin/(dashboard)/parents/page.tsx
- Phone number currently shown in table but adds clutter
- Phone still available in Parent Detail view

**Acceptance Criteria:**
- Phone column not visible in Parents table
- Phone still accessible in Parent Detail page
- Table columns realign properly
- No data loss

**Subtasks:**
- [ ] Find phone column in Parents table definition
- [ ] Remove or hide phone column from desktop view
- [ ] Verify table columns realign properly

---

### Clean up Parents table desktop view layout
General cleanup of the Parents table desktop view. Improve spacing, alignment, and overall visual appearance.

**Context:**
- File: /src/app/admin/(dashboard)/parents/page.tsx
- Table may have inconsistent spacing, alignment issues
- Should match visual quality of other admin tables

**Acceptance Criteria:**
- Consistent spacing throughout table
- Proper text alignment per column type
- Professional, polished appearance
- Consistent with app design system

**Subtasks:**
- [ ] Audit table CSS for spacing inconsistencies
- [ ] Fix cell padding and column alignment
- [ ] Review and improve hover/selection states

---

### Fix Email Balance and Add Payment buttons in Parents table
Fix the Email Balance and Add Payment buttons in Parents table.

**Context:**
- File: /src/app/admin/(dashboard)/parents/page.tsx
- Email Balance: Sends balance notification email to parent
- Add Payment: Opens payment form for parent's students

**Technical Details:**
- Email Balance calls: /api/admin/send-balance-email
- Add Payment navigates to /admin/add-payment or opens modal

**Acceptance Criteria:**
- Email Balance sends email successfully
- Add Payment opens correct form
- Loading states during operations
- Error messages on failure

**Subtasks:**
- [ ] Debug Email Balance button onClick handler
- [ ] Verify /api/admin/send-balance-email endpoint works
- [ ] Add loading and success/error states

---

### Add Email Balance and Add Payment buttons to Parent Detail page
Ensure the Email Balance and Add Payment buttons also exist and function correctly on the Parent Detail page.

**Context:**
- File: /src/app/admin/(dashboard)/parents/[id]/page.tsx
- Detail page should have same actions as table row buttons
- Provides alternative access point for common operations

**Acceptance Criteria:**
- Both buttons visible on Parent Detail page
- Email Balance works same as table version
- Add Payment works same as table version
- Mobile-friendly button placement
- Consistent styling with rest of page

**Subtasks:**
- [ ] Add Email Balance button to Parent Detail header
- [ ] Add Add Payment button to Parent Detail header
- [ ] Wire up handlers using same logic as table buttons
- [ ] Test both buttons on mobile view

---

## Students Module

### Fix Add Student button in Students table
Fix the Add Student button - currently not functioning properly in the Students table view.

**Context:**
- File: /src/app/admin/(dashboard)/students/page.tsx
- Button should open a form/modal to add a new student
- May need to select or create a parent during student creation

**Expected Behavior:**
- Click Add Student button
- Form opens for new student entry
- Fields: name, barcode, school_level, parent selection
- Student created and linked to parent
- Table refreshes with new student

**Acceptance Criteria:**
- Add Student button responds to click
- Form opens with all required fields
- Student successfully created
- Parent relationship established
- UI updates after creation

**Subtasks:**
- [ ] Debug onClick handler for Add Student button
- [ ] Verify modal/form state management works
- [ ] Fix parent selection in student form
- [ ] Test full student creation flow

---

### Fix Add Payment button in Students table
Fix the Add Payment button - currently not functioning properly in the Students table view.

**Context:**
- File: /src/app/admin/(dashboard)/students/page.tsx
- Button should open payment form for selected student
- Payment adds lunches to student's balance

**Acceptance Criteria:**
- Add Payment button responds to click
- Form shows correct student
- Payment processed successfully
- Balance updates in real-time
- Transaction created in history

**Subtasks:**
- [ ] Debug onClick handler for Add Payment button
- [ ] Verify student ID passed to payment form
- [ ] Fix navigation or modal logic
- [ ] Test payment and balance update flow

---

### Fix Add Lunches form submission in Student Detail
In Student Detail View: Add Lunches button does nothing after filling out the form.

**Context:**
- File: /src/app/admin/(dashboard)/students/[id]/page.tsx
- Add Lunches form allows adding lunch credits to student
- Form submits but nothing happens - no error, no success
- Possible issue: parent relationship may not exist when accessed from student context

**Possible Root Causes:**
1. Missing parent_id when creating transaction
2. API endpoint error not surfaced to UI
3. Form validation failing silently
4. State not updating after successful add

**Acceptance Criteria:**
- Add Lunches form submits successfully
- Balance updates after submission
- Transaction recorded in history
- Success/error feedback shown to user
- Works regardless of how student page was accessed

**Subtasks:**
- [ ] Check form submission handler in Student Detail
- [ ] Verify parent_id is available in student context
- [ ] Check network tab for API call issues
- [ ] Add success/error feedback to UI

---

### Fix parent link layout in Student Detail page
The parent link in the student detail page has layout issues - icon displays on a separate line from the link text.

**Context:**
- File: /src/app/admin/(dashboard)/students/[id]/page.tsx
- Parent link shows icon and parent name
- Icon and text should be inline, but icon wraps to own line

**Acceptance Criteria:**
- Icon and link text on same line
- Proper vertical alignment
- Consistent spacing between icon and text
- Works on mobile and desktop

**Subtasks:**
- [ ] Inspect parent link CSS in Student Detail page
- [ ] Add inline-flex with align-items center
- [ ] Test on mobile and desktop views

---

### Verify Add Parent works from Add Student view
Verify that the Add Parent functionality works correctly when accessed from the Add Student view.

**Context:**
- When adding a student, user may need to create a new parent
- Add Parent option should be available within Add Student form
- After creating parent, should link to new student

**Test Scenarios:**
1. Add student with existing parent (select from dropdown)
2. Add student with new parent (create inline)
3. Cancel parent creation mid-flow
4. Validation errors during parent creation

**Acceptance Criteria:**
- Add Parent option accessible from Add Student form
- New parent created successfully
- Student automatically linked to new parent
- UI handles errors gracefully
- Can cancel and return to student form

**Subtasks:**
- [ ] Test Add Student with existing parent selection
- [ ] Test Add Student with new parent creation
- [ ] Verify parent-student link created correctly
- [ ] Fix any issues found during testing

---

### Mobile optimize Add Student form
Clean up the Add Student form for mobile responsiveness.

**Context:**
- Add Student form may be modal or page-based
- Form fields need proper sizing and spacing on mobile
- Buttons should be easily tappable

**Acceptance Criteria:**
- Form usable on 320px width screens
- No horizontal scrolling required
- All fields accessible and readable
- Buttons full-width on mobile
- Keyboard doesn't obscure active field

**Subtasks:**
- [ ] Review Add Student form CSS for breakpoints
- [ ] Set input widths to 100% on mobile
- [ ] Make buttons full-width on mobile
- [ ] Test on 320px viewport

---

### Fix mobile layout for Sort/Filter controls in Students table
On mobile, move the Sort and Active Only filter to the same line.

**Context:**
- File: /src/app/admin/(dashboard)/students/page.tsx
- Same issue as Parents table - filter controls take too much vertical space
- Sort dropdown and Active Only toggle need compact layout

**Acceptance Criteria:**
- Filters on single line on mobile
- Controls remain usable and tappable
- No horizontal overflow
- Matches Parents table filter layout

**Subtasks:**
- [ ] Review current filter controls layout CSS
- [ ] Implement inline flexbox for Sort + Active filter
- [ ] Match layout with Parents table filters
- [ ] Test on mobile devices

---

## Security

### Run security audit on codebase
Run a comprehensive security check on the ACA Barcode Scanner app.

**Context:**
- GitHub repo: https://github.com/eppicservices/ACABarcodeScanner
- Stack: Next.js 16, React 19, TypeScript, Supabase, Prisma
- Features: Admin auth (NextAuth), Parent portal (token-based), API routes

**Security Areas to Audit:**

1. **Authentication & Authorization**
   - NextAuth configuration in /src/lib/auth/
   - Admin route protection via middleware
   - Parent portal token validation
   - Session management and JWT security

2. **API Security**
   - Input validation on all API routes (/src/app/api/)
   - SQL injection prevention in Supabase queries
   - CSRF protection
   - Rate limiting consideration

3. **Data Protection**
   - Sensitive data exposure (emails, phone numbers)
   - Parent access token security
   - Environment variable handling
   - Database row-level security

4. **Frontend Security**
   - XSS prevention in React components
   - Secure cookie settings
   - Content Security Policy headers

5. **Dependencies**
   - npm audit for vulnerable packages
   - Outdated dependencies check

**Acceptance Criteria:**
- All critical vulnerabilities identified and fixed
- Medium vulnerabilities documented with remediation plan
- Security best practices implemented
- No sensitive data exposed in client code

**Subtasks:**
- [ ] Run npm audit and fix vulnerable dependencies
- [ ] Audit NextAuth configuration and session security
- [ ] Review parent portal token generation and validation
- [ ] Check API routes for input validation and SQL injection
- [ ] Review middleware for proper route protection
- [ ] Check for sensitive data exposure in client code
- [ ] Review XSS prevention in React components
- [ ] Verify secure cookie and header settings
- [ ] Document findings and create remediation plan

---

## Backlog Summary

| Module | Tasks | Priority Issues |
|--------|-------|-----------------|
| Scanner Page | 1 | Admin link access |
| Settings & Performance | 2 | Calendar load time, input sizing |
| Transactions Module | 5 | Scroll bug, detail view, search |
| Parents Module | 10 | Multiple button fixes, mobile optimization |
| Students Module | 7 | Button fixes, form issues, mobile optimization |
| Security | 1 | Comprehensive audit |

**Total Backlog Tasks**: 26
