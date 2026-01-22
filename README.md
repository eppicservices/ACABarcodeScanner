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

- **Framework**: Next.js 14 (App Router)
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

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma database browser
- `npx prisma migrate dev` - Run migrations in development
- `npx prisma db seed` - Seed the database

## License

Private - All rights reserved
