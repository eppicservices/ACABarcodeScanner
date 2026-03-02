# ACA Barcode Scanner

A lunch tracking and payment system for schools. Features barcode scanning for student check-in, parent portal for payments, and administrative dashboard for management.

## Features

- Barcode scanning for student lunch tracking
- Parent portal with secure access links
- Admin dashboard for student/parent management
- Transaction history and balance tracking
- CSV import/export
- Email notifications (receipts, low balance alerts)
- School calendar integration

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **Deployment**: Docker with Caddy reverse proxy

## Local Development

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- npm or yarn

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ACABarcodeScanner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.development.example .env.local
   ```

4. **Start the database**
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

5. **Run database migrations**
   ```bash
   npx prisma migrate dev
   ```

6. **Seed the database (optional)**
   ```bash
   npx prisma db seed
   ```

7. **Start the development server**
   ```bash
   npm run dev
   ```

8. **Open the app**
   - Application: http://localhost:3000
   - Admin signup: http://localhost:3000/admin/signup

### Development Database Management

**View database with pgAdmin** (optional):
```bash
docker compose -f docker-compose.dev.yml --profile admin up -d
```
Then access pgAdmin at http://localhost:5050

**Reset the database**:
```bash
npx prisma migrate reset
```

**Generate Prisma client after schema changes**:
```bash
npx prisma generate
```

**Create a new migration**:
```bash
npx prisma migrate dev --name your_migration_name
```

### Stopping Development

```bash
# Stop the database
docker compose -f docker-compose.dev.yml down

# Stop and remove data (full reset)
docker compose -f docker-compose.dev.yml down -v
```

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed production deployment instructions.

### Quick Production Start

1. **Configure environment**
   ```bash
   cp .env.production.example .env
   # Edit .env with your production values
   ```

2. **Update Caddyfile**
   ```bash
   # Replace 'your-domain.com' with your actual domain
   ```

3. **Start all services**
   ```bash
   docker compose up -d
   ```

4. **Enable backups** (optional)
   ```bash
   docker compose --profile backup up -d
   ```

## Project Structure

```
src/
├── actions/          # Server actions (database operations)
├── app/              # Next.js app router pages
│   ├── admin/        # Admin dashboard
│   ├── api/          # API routes
│   └── parent/       # Parent portal
├── components/       # React components
├── lib/              # Utilities and configurations
│   ├── auth/         # NextAuth configuration
│   └── prisma.ts     # Prisma client
└── types/            # TypeScript types

prisma/
├── schema.prisma     # Database schema
├── migrations/       # Database migrations
└── seed.ts           # Seed data for development
```

## Environment Variables

See `.env.development.example` for development and `.env.production.example` for production configuration.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Secret for session encryption
- `NEXTAUTH_URL` - Application URL
- `SMTP_*` - Email configuration (optional)

## Make Commands

Run `make help` to see all available commands. Common ones:

```bash
# Development
make setup          # Initial setup (install, env, db, migrate)
make dev            # Start dev environment (db + app)
make dev-db         # Start database only
make studio         # Open Prisma Studio

# Database
make migrate-dev    # Run migrations (dev)
make seed           # Seed test data
make backup         # Create database backup
make restore FILE=x # Restore from backup

# Docker & Production
make docker-build   # Build Docker image
make deploy         # Deploy (pull, build, restart)
make logs           # Follow all container logs
make prod-status    # Show service status
```

## CI/CD with GitHub Actions

The project includes a GitHub Actions workflow (`.github/workflows/ci-cd.yml`) that:

1. **Lints and type-checks** on all PRs
2. **Builds Docker image** on push to main
3. **Pushes to GitHub Container Registry** (ghcr.io)
4. **Deploys to production** via SSH (optional)

### Setup GitHub Actions Deployment

1. Go to your repo **Settings > Secrets and variables > Actions**

2. Add these secrets:
   | Secret | Description |
   |--------|-------------|
   | `DEPLOY_HOST` | Production server IP or hostname |
   | `DEPLOY_USER` | SSH username |
   | `DEPLOY_KEY` | SSH private key (full content) |
   | `DEPLOY_PATH` | Path on server (e.g., `/opt/aca-scanner`) |

3. Create a **production environment** (Settings > Environments):
   - Name: `production`
   - Add protection rules if desired (required reviewers, etc.)
   - Add variable `PRODUCTION_URL` with your site URL

4. On your production server:
   ```bash
   # Clone repo
   git clone https://github.com/YOUR_USER/ACABarcodeScanner.git /opt/aca-scanner
   cd /opt/aca-scanner

   # Setup environment
   cp .env.production.example .env
   nano .env  # Fill in values

   # Login to GitHub Container Registry
   echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_USER --password-stdin

   # Initial deploy
   docker compose up -d
   ```

### Manual Deployment

Trigger a manual deploy from **Actions > CI/CD > Run workflow**.

## Legacy Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma database browser
- `npx prisma migrate dev` - Run migrations in development
- `npx prisma db seed` - Seed the database

## License

Private - All rights reserved
