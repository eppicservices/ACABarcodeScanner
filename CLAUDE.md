# ACA Barcode Scanner - Project Context

## Monday.com Board

**Board**: [ACA Barcode Scanner](https://shepherdsglobal.monday.com/boards/18395942198)
**Board ID**: 18395942198
**Workspace**: Curtis's Workspace (ID: 13943256)

Use this board to track development tasks, bugs, and feature requests for this project.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS
- **Language**: TypeScript
- **Database**: PostgreSQL via Prisma ORM
- **Authentication**: NextAuth v5 (credentials provider)
- **Deployment**: Docker (self-hosted) or Vercel

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/              # Admin dashboard (protected)
│   │   └── (dashboard)/    # Dashboard layout group
│   │       ├── students/   # Student management
│   │       ├── parents/    # Parent management
│   │       ├── transactions/ # Transaction history
│   │       ├── settings/   # App settings
│   │       └── ...
│   ├── api/                # API routes
│   │   ├── admin/          # Admin-only endpoints
│   │   ├── parent-portal/  # Parent portal endpoints
│   │   └── cron/           # Scheduled task endpoints
│   └── parent/             # Parent portal (token-based auth)
├── actions/                # Server actions (Prisma operations)
├── components/             # React components
├── lib/                    # Utilities and configurations
│   ├── auth/               # NextAuth configuration
│   ├── email/              # Email templates and senders
│   └── prisma.ts           # Prisma client instance
└── types/                  # TypeScript type definitions
```

## Key Files

- `prisma/schema.prisma` - Database schema
- `src/lib/auth/nextauth-config.ts` - Authentication setup
- `src/middleware.ts` - Route protection
- `prd.md` - Product requirements and backlog

## Commands

```bash
# Development
npm run dev

# Build
npm run build

# Database
npx prisma migrate dev    # Run migrations (dev)
npx prisma migrate deploy # Run migrations (prod)
npx prisma studio         # Database GUI

# Docker
docker compose up -d                          # Production
docker compose -f docker-compose.dev.yml up -d # Dev database only
```

## Authentication

- **Admin**: NextAuth with credentials (email/password)
- **Parents**: Token-based access via `/parent/[token]` route
- Admin routes protected by middleware checking session
- Parent portal validates tokens against `parent_access_tokens` table

## Related Documentation

- See `prd.md` for full requirements and development backlog
- See `DEPLOYMENT.md` for deployment instructions
