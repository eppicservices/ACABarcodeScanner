# Deployment Guide

This guide covers deployment for the ACA Barcode Scanner application using Docker with PostgreSQL and NextAuth.js.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Production Deployment](#production-deployment)
- [Development Setup](#development-setup)
- [SSL/TLS & Domain Setup](#ssltls--domain-setup)
- [Database Migrations](#database-migrations)
- [Monitoring & Logging](#monitoring--logging)
- [Backup & Restore](#backup--restore)
- [Troubleshooting](#troubleshooting)
- [Security Recommendations](#security-recommendations)
- [Environment Variables Reference](#environment-variables-reference)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Caddy (HTTPS)                           │
│                   Ports 80, 443                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                       ┌─────────────┐
                       │   Next.js   │
                       │   App       │
                       │   :3000     │
                       │  (Prisma +  │
                       │  NextAuth)  │
                       └─────────────┘
                              │
                              ▼
                       ┌─────────────┐
                       │  PostgreSQL │
                       │    :5432    │
                       └─────────────┘
```

**Stack:**
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js with credentials
- **Web Server:** Caddy (automatic HTTPS)
- **Container Runtime:** Docker & Docker Compose

**Resource Requirements:**
- RAM: ~1GB minimum (2GB recommended)
- Storage: 10GB+ for app, database, and backups

---

## Prerequisites

- VM or server with Docker and Docker Compose installed
- Domain name (recommended for HTTPS)
- Basic familiarity with command line

### Installing Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Log out and back in for group changes
exit
```

---

## Quick Start

```bash
# Clone repository
git clone https://github.com/your-username/ACABarcodeScanner.git
cd ACABarcodeScanner

# Copy environment template
cp .env.production.example .env

# Generate secrets
echo "POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d '/+=' | cut -c1-32)"
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
echo "CRON_SECRET=$(openssl rand -hex 32)"

# Edit .env with your values
nano .env

# Start services
docker compose up -d

# Check status
docker compose ps
```

---

## Production Deployment

### Step 1: Generate Secrets

```bash
# PostgreSQL password
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d '/+=' | cut -c1-32)
echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD"

# NextAuth secret
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo "NEXTAUTH_SECRET=$NEXTAUTH_SECRET"

# Cron secret
CRON_SECRET=$(openssl rand -hex 32)
echo "CRON_SECRET=$CRON_SECRET"
```

### Step 2: Configure Environment

```bash
cp .env.production.example .env
nano .env
```

Fill in the values:
```bash
# PostgreSQL Configuration
POSTGRES_PASSWORD=your-generated-password

# NextAuth Configuration
NEXTAUTH_SECRET=your-generated-secret
NEXTAUTH_URL=https://your-domain.com

# Application
NEXT_PUBLIC_SITE_URL=https://your-domain.com
CRON_SECRET=your-generated-cron-secret
```

### Step 3: Configure Domain (Caddyfile)

Edit the Caddyfile with your domain:
```bash
nano Caddyfile
```

Replace `lunch.example.com` with your actual domain.

### Step 4: Deploy

```bash
# Build and start services
docker compose up -d --build

# Wait for database to be ready
docker compose ps

# Verify health
curl http://localhost:3000/api/health
```

### Step 5: Create First Admin User

1. Access your app at `https://your-domain.com`
2. Navigate to `/admin/login`
3. Click "Create Account" (first user only)
4. Create your admin account - you'll be automatically set as `super_admin`

### Step 6: Configure Cron Jobs

```bash
crontab -e
```

Add these lines:
```cron
# Send low balance emails daily at 6 AM
0 6 * * * curl -s -H "Authorization: Bearer YOUR_CRON_SECRET" "https://your-domain.com/api/cron/send-low-balance-emails" >> /var/log/cron-emails.log 2>&1

# Sync calendar daily at midnight
0 0 * * * curl -s -H "Authorization: Bearer YOUR_CRON_SECRET" "https://your-domain.com/api/cron/sync-calendar" >> /var/log/cron-calendar.log 2>&1
```

### Updating the Application

```bash
cd ACABarcodeScanner
git pull origin main
docker compose up -d --build
```

Migrations run automatically on container startup via the entrypoint script.

---

## Development Setup

For local development with hot reload:

```bash
# Start only the database
docker compose -f docker-compose.dev.yml up -d

# Copy development environment
cp .env.development.example .env.local

# Install dependencies
npm install

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npm run db:seed

# Start dev server
npm run dev
```

### Optional: pgAdmin

```bash
# Start with pgAdmin for database management
docker compose -f docker-compose.dev.yml --profile tools up -d

# Access pgAdmin at http://localhost:5050
# Email: admin@localhost.com
# Password: admin
```

---

## SSL/TLS & Domain Setup

### Caddy (Automatic - Recommended)

Caddy automatically obtains and renews SSL certificates from Let's Encrypt.

**Requirements:**
- Domain pointing to your server
- Ports 80 and 443 open
- No other service using these ports

**Verify Certificate:**
```bash
# Check certificate status
docker compose logs caddy

# Test SSL
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

### DNS Configuration

**A Record:**
```
Type: A
Name: @ (or subdomain like "lunch")
Content: YOUR_SERVER_IP
TTL: Auto
```

**Verify DNS:**
```bash
dig your-domain.com +short
```

---

## Database Migrations

### Running Migrations

Migrations run automatically on container startup. To run manually:

```bash
# Apply pending migrations
docker compose exec app npx prisma migrate deploy

# View migration status
docker compose exec app npx prisma migrate status
```

### Creating New Migrations

In development:
```bash
npx prisma migrate dev --name description_of_change
```

### Seeding Data

```bash
# Run seed script
docker compose exec app npm run db:seed
```

---

## Monitoring & Logging

### Container Logs

```bash
# Follow all containers
docker compose logs -f

# Specific service
docker compose logs -f app
docker compose logs -f db

# Last 100 lines
docker compose logs --tail=100 app
```

### Health Checks

```bash
# Check app health
curl http://localhost:3000/api/health

# Check container health
docker compose ps
```

### Database Monitoring

```bash
# Connect to database
docker compose exec db psql -U postgres -d lunch_scanner

# Check database size
SELECT pg_size_pretty(pg_database_size('lunch_scanner'));

# Check active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';
```

### Uptime Monitoring

**Option A: UptimeRobot (Free)**
1. Sign up at [uptimerobot.com](https://uptimerobot.com)
2. Add HTTP(s) monitor for `https://your-domain.com/api/health`
3. Configure alerts

---

## Backup & Restore

### Automated Backups

The docker-compose.yml includes a backup service that creates daily backups and retains them for 7 days.

Backups are stored in `./backups/` directory.

### Manual Backup

```bash
# Create backup
docker compose exec db pg_dump -U postgres lunch_scanner > backup_$(date +%Y%m%d_%H%M%S).sql

# Compressed backup
docker compose exec db pg_dump -U postgres lunch_scanner | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Restore

```bash
# Stop the application
docker compose stop app

# Restore from backup
docker compose exec -T db psql -U postgres lunch_scanner < backup_20240115.sql

# Or from compressed
gunzip < backup_20240115.sql.gz | docker compose exec -T db psql -U postgres lunch_scanner

# Restart application
docker compose start app
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose logs app

# Check if ports are in use
sudo lsof -i :3000
sudo lsof -i :5432

# Rebuild from scratch
docker compose down -v
docker compose up -d --build
```

### Database Connection Errors

```bash
# Check if database is running
docker compose ps db

# Check database health
docker compose exec db pg_isready -U postgres

# View database logs
docker compose logs db
```

### SSL Certificate Issues

```bash
# Check Caddy logs
docker compose logs caddy

# Verify DNS
dig your-domain.com

# Force certificate renewal
docker compose restart caddy
```

### Memory Issues

```bash
# Check container memory usage
docker stats

# Increase swap if needed
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## Security Recommendations

### Essential Security Measures

1. **Never commit secrets**
   - Use `.env.example` as templates
   - Add `.env*` to `.gitignore`

2. **Use strong passwords**
   ```bash
   openssl rand -base64 32
   ```

3. **Enable firewall**
   ```bash
   sudo ufw default deny incoming
   sudo ufw default allow outgoing
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

4. **Keep systems updated**
   ```bash
   sudo apt update && sudo apt upgrade -y
   docker compose pull
   docker compose up -d
   ```

5. **Use SSH keys, disable password auth**
   ```bash
   # /etc/ssh/sshd_config
   PasswordAuthentication no
   PubkeyAuthentication yes
   ```

### Security Checklist

- [ ] All secrets are generated (not default values)
- [ ] `.env` files are not committed to git
- [ ] Firewall is enabled with minimal open ports
- [ ] SSH uses key authentication only
- [ ] Database is not exposed publicly (port 5432 internal only)
- [ ] HTTPS is enabled in production
- [ ] Regular backups are configured
- [ ] System updates are scheduled

---

## Environment Variables Reference

### Required Variables

| Variable | Description |
|----------|-------------|
| `POSTGRES_PASSWORD` | PostgreSQL database password |
| `NEXTAUTH_SECRET` | NextAuth.js session secret |
| `NEXTAUTH_URL` | Base URL for NextAuth callbacks (e.g., `https://your-domain.com`) |
| `NEXT_PUBLIC_SITE_URL` | Public URL of your application |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | postgres | PostgreSQL username |
| `POSTGRES_DB` | lunch_scanner | PostgreSQL database name |
| `CRON_SECRET` | - | Secret for cron job authentication |
| `PORT` | 3000 | Application port |
| `NODE_ENV` | production | Node environment |

### Example .env File

```bash
# PostgreSQL
POSTGRES_PASSWORD=your-secure-password-here

# NextAuth
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=https://lunch.yourschool.com

# Application
NEXT_PUBLIC_SITE_URL=https://lunch.yourschool.com
CRON_SECRET=your-cron-secret-here
```
