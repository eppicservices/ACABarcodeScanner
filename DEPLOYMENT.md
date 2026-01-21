# Deployment Guide

This guide covers deployment options for the ACA Barcode Scanner application.

## Table of Contents

- [Deployment Options Overview](#deployment-options-overview)
- [Option 1: Vercel + Supabase Cloud](#option-1-vercel--supabase-cloud-recommended)
- [Option 2: Docker + Supabase Cloud](#option-2-docker--supabase-cloud)
- [Option 3: Docker Self-Hosted (Lightweight)](#option-3-docker-self-hosted-lightweight)
- [Option 4: DigitalOcean Deployment](#option-4-digitalocean-deployment)
- [SSL/TLS & Domain Setup](#ssltls--domain-setup)
- [Database Migrations](#database-migrations)
- [Monitoring & Logging](#monitoring--logging)
- [Backup & Restore](#backup--restore)
- [Troubleshooting](#troubleshooting)
- [Security Recommendations](#security-recommendations)
- [Environment Variables Reference](#environment-variables-reference)

---

## Deployment Options Overview

| Option | Best For | Database | Auth | RAM Required | Cost |
|--------|----------|----------|------|--------------|------|
| **Vercel + Supabase Cloud** | Quick setup, managed services | Supabase Cloud | Supabase Auth | N/A (managed) | Free tier available |
| **Docker + Supabase Cloud** | Self-hosted app, managed DB | Supabase Cloud | Supabase Auth | ~512MB | VM costs only |
| **Docker Self-Hosted** | Complete control, low resources | PostgreSQL (Prisma) | NextAuth.js | ~1GB | From $6/mo |
| **DigitalOcean** | Simple cloud deployment | Either | Either | Varies | From $6/mo |

### Architecture Options

The application supports two backend configurations:

**Supabase Mode (Default)**
- Database: Supabase Cloud
- Authentication: Supabase Auth
- Best for: Vercel deployments, managed infrastructure

**Prisma/NextAuth Mode**
- Database: PostgreSQL with Prisma ORM
- Authentication: NextAuth.js with credentials
- Best for: Self-hosted Docker deployments, low resource environments

---

## Option 1: Vercel + Supabase Cloud (Recommended)

The easiest deployment with automatic builds, SSL, global CDN, and managed database.

### Prerequisites
- GitHub, GitLab, or Bitbucket account
- Supabase account (free tier available at [supabase.com](https://supabase.com))

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose an organization and enter:
   - **Project name:** ACA Barcode Scanner
   - **Database password:** Generate a strong password (save this!)
   - **Region:** Choose closest to your users
4. Click "Create new project" and wait for provisioning (~2 minutes)

### Step 2: Set Up the Database

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the contents of `docker/volumes/db/init.sql` from this repository
4. Paste into the SQL editor and click "Run"
5. Verify tables were created in **Table Editor**

### Step 3: Get Your API Keys

1. Go to **Settings** → **API**
2. Note these values (you'll need them for Vercel):
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon public** key
   - **service_role** key (keep this secret!)

### Step 4: Deploy to Vercel

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. Go to [vercel.com](https://vercel.com) and sign in with GitHub

3. Click "Add New..." → "Project"

4. Import your repository

5. Configure the project:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build` (default)

6. Add Environment Variables (click "Environment Variables"):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
   NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
   CRON_SECRET=generate-with-openssl-rand-hex-32
   ```

7. Click "Deploy"

### Step 5: Create First Admin User

1. Visit `https://your-app.vercel.app/admin/signup`
2. Create your admin account
3. In Supabase SQL Editor, promote yourself to super_admin:
   ```sql
   UPDATE admin_users
   SET role = 'super_admin'
   WHERE email = 'your-email@example.com';
   ```

### Step 6: Configure Cron Jobs (Vercel Pro Required)

The `vercel.json` file is pre-configured. Vercel automatically authenticates cron requests using `CRON_SECRET`.

For free tier, use an external cron service like [cron-job.org](https://cron-job.org):
- URL: `https://your-app.vercel.app/api/cron/send-low-balance-emails`
- Method: GET
- Headers: `Authorization: Bearer YOUR_CRON_SECRET`
- Schedule: Daily at 6:00 AM

### Step 7: Set Up Custom Domain (Optional)

1. In Vercel, go to your project → **Settings** → **Domains**
2. Add your domain (e.g., `lunch.yourschool.com`)
3. Configure DNS as instructed by Vercel
4. Update `NEXT_PUBLIC_SITE_URL` environment variable to your custom domain

---

## Option 2: Docker + Supabase Cloud

Self-host the application while using Supabase's managed database.

### Prerequisites
- VM with Docker and Docker Compose installed (Ubuntu 22.04+ recommended)
- Domain name (optional but recommended for HTTPS)
- Supabase account

### Step 1: Set Up Supabase

Follow Steps 1-3 from Option 1 to create your Supabase project and database.

### Step 2: Prepare Your Server

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

### Step 3: Clone and Configure

```bash
# Clone repository
git clone https://github.com/your-username/ACABarcodeScanner.git
cd ACABarcodeScanner

# Create environment file
cp .env.example .env

# Generate cron secret
CRON_SECRET=$(openssl rand -hex 32)
echo "Generated CRON_SECRET: $CRON_SECRET"

# Edit environment file
nano .env
```

Fill in your `.env` file:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=https://your-domain.com
CRON_SECRET=your-generated-cron-secret
PORT=3000
```

### Step 4: Deploy

```bash
# Build and start
docker compose up -d --build

# Check status
docker compose ps

# View logs
docker compose logs -f app
```

### Step 5: Set Up HTTPS with Caddy

1. Edit `docker-compose.yml` and uncomment the Caddy service section

2. Edit the `Caddyfile`:
   ```bash
   nano Caddyfile
   ```
   Replace `your-domain.com` with your actual domain

3. Restart services:
   ```bash
   docker compose down
   docker compose up -d
   ```

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

---

## Option 3: Docker Self-Hosted (Lightweight)

A lightweight self-hosted option using PostgreSQL with Prisma ORM and NextAuth.js for authentication. This option requires only ~1GB RAM and is ideal for low-resource environments.

### Prerequisites
- VM with at least 1GB RAM (2GB recommended)
- Docker and Docker Compose installed
- Domain name (recommended for HTTPS)

### Architecture Overview

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

### Step 1: Generate Secrets

```bash
# PostgreSQL password
echo "POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d '/+=' | cut -c1-32)"

# NextAuth secret
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"

# Cron secret
echo "CRON_SECRET=$(openssl rand -hex 32)"
```

### Step 2: Configure Environment

```bash
cp .env.docker.example .env
nano .env
```

Fill in the values:
```bash
# PostgreSQL Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-generated-password
POSTGRES_DB=lunch_scanner

# NextAuth Configuration
NEXTAUTH_SECRET=your-generated-secret
NEXTAUTH_URL=https://your-domain.com

# Application
PORT=3000
NEXT_PUBLIC_SITE_URL=https://your-domain.com
CRON_SECRET=your-generated-cron-secret
```

### Step 3: Deploy

```bash
# Clone repository
git clone https://github.com/your-username/ACABarcodeScanner.git
cd ACABarcodeScanner

# Build and start services
docker compose -f docker-compose.prisma.yml up -d --build

# Wait for database to be ready (check health)
docker compose -f docker-compose.prisma.yml ps

# Run database migrations
docker compose -f docker-compose.prisma.yml exec app npx prisma migrate deploy
```

### Step 4: Verify Services

```bash
# Check all containers are running
docker compose -f docker-compose.prisma.yml ps

# Check database is healthy
docker compose -f docker-compose.prisma.yml exec postgres pg_isready -U postgres

# Check app health
curl http://localhost:3000/api/health
```

### Step 5: Create First Admin User

1. Access your app at `https://your-domain.com` (or `http://localhost:3000`)
2. Navigate to `/admin/signup`
3. Create your first admin account
4. You'll be automatically set as `super_admin` (first user only)

### Step 6: Set Up HTTPS with Caddy (Production)

1. Edit `docker-compose.prisma.yml` and uncomment the Caddy service section

2. Edit `Caddyfile`:
   ```bash
   nano Caddyfile
   ```
   Replace `your-domain.com` with your actual domain

3. Ensure your domain's DNS points to your server

4. Restart services:
   ```bash
   docker compose -f docker-compose.prisma.yml down
   docker compose -f docker-compose.prisma.yml up -d
   ```

### Step 7: Configure Cron Jobs

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
docker compose -f docker-compose.prisma.yml up -d --build

# Run any new migrations
docker compose -f docker-compose.prisma.yml exec app npx prisma migrate deploy
```

### Resource Comparison

| Deployment Type | RAM Usage | Services Running |
|-----------------|-----------|------------------|
| Docker + Supabase Cloud | ~512MB | App only |
| Docker Self-Hosted (Prisma) | ~1GB | App + PostgreSQL |
| Docker Self-Hosted (Supabase) | ~4GB | App + Full Supabase stack |

---

## Option 4: DigitalOcean Deployment

### Option 4A: DigitalOcean Droplet (Docker)

Best for: Full control with simple cloud infrastructure.

#### Step 1: Create a Droplet

1. Log in to [DigitalOcean](https://cloud.digitalocean.com)
2. Click **Create** → **Droplets**
3. Configure:
   - **Region:** Choose closest to your users
   - **Image:** **Marketplace** → Search "Docker"
   - **Size:** Basic → Regular → $12/mo (2GB RAM) minimum
   - **Authentication:** SSH keys (recommended)
   - **Hostname:** `aca-barcode-scanner`
4. Click **Create Droplet**

#### Step 2: Configure DNS

1. In DigitalOcean, go to **Networking** → **Domains**
2. Add your domain
3. Create an **A record**:
   - Hostname: `@` or `lunch` (for subdomain)
   - Points to: Your Droplet IP
4. Wait for DNS propagation (5-30 minutes)

#### Step 3: Connect and Deploy

```bash
# SSH into your Droplet
ssh root@your-droplet-ip

# Clone repository
git clone https://github.com/your-username/ACABarcodeScanner.git
cd ACABarcodeScanner

# For Supabase Cloud:
cp .env.example .env
nano .env
# Fill in Supabase credentials

# OR for self-hosted:
cp .env.selfhosted.example .env
nano .env
# Fill in all credentials

# Deploy
docker compose up -d --build
# OR for self-hosted:
docker compose -f docker-compose.selfhosted.yml --profile production up -d --build
```

#### Step 4: Configure Firewall

```bash
# Enable UFW firewall
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable

# Verify
ufw status
```

### Option 4B: DigitalOcean App Platform

Best for: Managed deployment without server management.

#### Step 1: Create App

1. Go to **Apps** → **Create App**
2. Select **GitHub** and authorize
3. Choose your repository and branch
4. Configure:
   - **Type:** Web Service
   - **Source:** Dockerfile
   - **HTTP Port:** 3000

#### Step 2: Configure Environment Variables

In the app settings, add:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=https://your-app.ondigitalocean.app
CRON_SECRET=your-cron-secret
```

#### Step 3: Configure Resources

- **Instance Size:** Basic ($5/mo minimum, $12/mo recommended)
- **Containers:** 1 (scale as needed)

#### Step 4: Add Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your domain
3. Configure DNS with the provided CNAME record

---

## SSL/TLS & Domain Setup

### Understanding SSL Options

| Method | Pros | Cons |
|--------|------|------|
| **Caddy (Automatic)** | Zero config, auto-renewal | Requires port 80/443 |
| **Let's Encrypt + Certbot** | Free, widely supported | Manual renewal setup |
| **Cloudflare** | DDoS protection, caching | Additional service |

### Option A: Caddy (Recommended)

Caddy automatically obtains and renews SSL certificates from Let's Encrypt.

**Requirements:**
- Domain pointing to your server
- Ports 80 and 443 open
- No other service using these ports

**Configuration:**
```caddyfile
# Caddyfile
your-domain.com {
    reverse_proxy app:3000
    encode gzip

    header {
        X-Content-Type-Options nosniff
        X-Frame-Options SAMEORIGIN
        Referrer-Policy strict-origin-when-cross-origin
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
    }
}
```

**Verify Certificate:**
```bash
# Check certificate status
docker compose exec caddy caddy list-certificates

# View certificate details
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

### Option B: Let's Encrypt with Certbot

For setups not using Caddy:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### Option C: Cloudflare (with proxy)

1. Add your domain to Cloudflare
2. Update nameservers at your registrar
3. In Cloudflare DNS:
   - Add A record pointing to your server
   - Enable proxy (orange cloud)
4. In SSL/TLS settings:
   - Set mode to "Full (strict)"
5. Configure origin certificate or use Caddy behind Cloudflare

### DNS Configuration Examples

**A Record (direct):**
```
Type: A
Name: @ (or subdomain like "lunch")
Content: YOUR_SERVER_IP
TTL: Auto
Proxy: Off (for Caddy) or On (for Cloudflare)
```

**CNAME Record (for some platforms):**
```
Type: CNAME
Name: lunch
Content: your-app.vercel.app
TTL: Auto
```

### Verifying DNS Propagation

```bash
# Check A record
dig your-domain.com +short

# Check from multiple locations
dig @8.8.8.8 your-domain.com
dig @1.1.1.1 your-domain.com

# Online tool: https://dnschecker.org
```

---

## Database Migrations

### Understanding Migrations

Migrations are SQL scripts that modify your database schema. They should be:
- **Versioned:** Each migration has a unique identifier
- **Idempotent:** Can be run multiple times safely
- **Reversible:** Include rollback scripts when possible

### Directory Structure

```
docker/
└── volumes/
    └── db/
        ├── init.sql           # Initial schema (runs on first setup)
        └── migrations/        # Incremental changes
            ├── 001_add_column.sql
            ├── 002_create_table.sql
            └── ...
```

### Creating a Migration

1. Create a new migration file:
   ```bash
   # Use timestamp for ordering
   touch docker/volumes/db/migrations/$(date +%Y%m%d%H%M%S)_description.sql
   ```

2. Write your migration:
   ```sql
   -- Migration: Add student photo URL
   -- Created: 2024-01-15

   -- Up
   ALTER TABLE students
   ADD COLUMN IF NOT EXISTS photo_url TEXT;

   -- Down (for rollback, keep commented)
   -- ALTER TABLE students DROP COLUMN IF EXISTS photo_url;
   ```

### Running Migrations

**On Supabase Cloud:**
1. Go to SQL Editor in Supabase dashboard
2. Paste and run your migration
3. Verify in Table Editor

**On Self-Hosted:**
```bash
# Single migration
docker compose -f docker-compose.selfhosted.yml exec db \
  psql -U postgres -d postgres -f /path/to/migration.sql

# Or connect directly
docker compose -f docker-compose.selfhosted.yml exec db psql -U postgres

# Then paste your SQL
```

**Using a migration script:**
```bash
#!/bin/bash
# run-migrations.sh

MIGRATIONS_DIR="docker/volumes/db/migrations"
DB_CONTAINER="acabarcodescanner-db-1"

for migration in $(ls -1 $MIGRATIONS_DIR/*.sql | sort); do
    echo "Running: $migration"
    docker exec -i $DB_CONTAINER psql -U postgres -d postgres < "$migration"
done
```

### Migration Best Practices

1. **Always backup first:**
   ```bash
   docker compose -f docker-compose.selfhosted.yml exec db \
     pg_dump -U postgres postgres > backup_before_migration.sql
   ```

2. **Test in development first**

3. **Use transactions for safety:**
   ```sql
   BEGIN;

   ALTER TABLE students ADD COLUMN photo_url TEXT;

   -- Verify
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'students' AND column_name = 'photo_url';

   COMMIT;
   -- or ROLLBACK; if something went wrong
   ```

4. **Track applied migrations:**
   ```sql
   -- Create migrations tracking table
   CREATE TABLE IF NOT EXISTS _migrations (
       id SERIAL PRIMARY KEY,
       name TEXT NOT NULL UNIQUE,
       applied_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Record migration
   INSERT INTO _migrations (name) VALUES ('001_add_photo_url.sql');
   ```

### Common Migration Scenarios

**Adding a column:**
```sql
ALTER TABLE students
ADD COLUMN IF NOT EXISTS photo_url TEXT;
```

**Adding an index:**
```sql
CREATE INDEX IF NOT EXISTS idx_students_name
ON students(name);
```

**Adding a constraint:**
```sql
ALTER TABLE students
ADD CONSTRAINT students_balance_check
CHECK (balance >= -10);
```

**Modifying a column:**
```sql
-- Change type
ALTER TABLE app_settings
ALTER COLUMN elementary_lunch_price TYPE DECIMAL(10,2);

-- Add default
ALTER TABLE students
ALTER COLUMN is_active SET DEFAULT true;
```

---

## Monitoring & Logging

### Container Logs

**View all logs:**
```bash
# Follow all containers
docker compose -f docker-compose.selfhosted.yml logs -f

# Specific service
docker compose -f docker-compose.selfhosted.yml logs -f app
docker compose -f docker-compose.selfhosted.yml logs -f db
docker compose -f docker-compose.selfhosted.yml logs -f auth

# Last 100 lines
docker compose -f docker-compose.selfhosted.yml logs --tail=100 app

# Since specific time
docker compose -f docker-compose.selfhosted.yml logs --since="2024-01-15T10:00:00" app
```

### Setting Up Log Persistence

Add to `docker-compose.selfhosted.yml`:
```yaml
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### Log Aggregation with Loki (Optional)

Add to your docker-compose:
```yaml
  loki:
    image: grafana/loki:2.9.0
    ports:
      - "3100:3100"
    volumes:
      - loki-data:/loki
    command: -config.file=/etc/loki/local-config.yaml
    restart: unless-stopped

  promtail:
    image: grafana/promtail:2.9.0
    volumes:
      - /var/log:/var/log
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
    command: -config.file=/etc/promtail/config.yml
    restart: unless-stopped
```

### Health Monitoring

**Built-in health endpoint:**
```bash
# Check app health
curl http://localhost:3000/api/health

# Expected response:
# {"status":"healthy","timestamp":"2024-01-15T10:30:00.000Z"}
```

**Docker health checks:**
```bash
# View health status
docker compose -f docker-compose.selfhosted.yml ps

# Detailed health info
docker inspect --format='{{json .State.Health}}' acabarcodescanner-app-1
```

### Setting Up Uptime Monitoring

**Option A: UptimeRobot (Free)**
1. Sign up at [uptimerobot.com](https://uptimerobot.com)
2. Add HTTP(s) monitor for `https://your-domain.com/api/health`
3. Set check interval (5 minutes for free tier)
4. Configure alerts (email, Slack, etc.)

**Option B: Healthchecks.io (Free tier)**
1. Sign up at [healthchecks.io](https://healthchecks.io)
2. Create a check
3. Add to your cron jobs:
   ```cron
   */5 * * * * curl -fsS --retry 3 https://hc-ping.com/your-uuid > /dev/null
   ```

### Database Monitoring

**Check database size:**
```sql
SELECT pg_size_pretty(pg_database_size('postgres'));
```

**Check table sizes:**
```sql
SELECT
    relname AS table_name,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

**Check active connections:**
```sql
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';
```

**Check slow queries:**
```sql
SELECT
    query,
    calls,
    mean_time,
    total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### Setting Up Grafana Dashboard (Advanced)

Add to docker-compose:
```yaml
  grafana:
    image: grafana/grafana:10.0.0
    ports:
      - "3002:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
    restart: unless-stopped
```

Access at `http://your-server:3002` and:
1. Add PostgreSQL as a data source
2. Import dashboard templates for PostgreSQL
3. Create custom dashboards for your app metrics

### Alert Configuration

**Simple disk space alert (cron):**
```bash
# Add to crontab
0 */6 * * * /usr/local/bin/check-disk.sh

# check-disk.sh
#!/bin/bash
THRESHOLD=80
USAGE=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')
if [ "$USAGE" -gt "$THRESHOLD" ]; then
    echo "Disk usage is ${USAGE}%" | mail -s "Disk Alert" admin@example.com
fi
```

---

## Backup & Restore

### Database Backup

**Manual backup:**
```bash
# Create backup
docker compose -f docker-compose.selfhosted.yml exec db \
  pg_dump -U postgres postgres > backup_$(date +%Y%m%d_%H%M%S).sql

# Compressed backup
docker compose -f docker-compose.selfhosted.yml exec db \
  pg_dump -U postgres postgres | gzip > backup_$(date +%Y%m%d).sql.gz
```

**Automated daily backup:**
```bash
# Create backup script
cat > /usr/local/bin/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/aca-barcode"
RETENTION_DAYS=30

mkdir -p $BACKUP_DIR
cd /path/to/ACABarcodeScanner

# Create backup
docker compose -f docker-compose.selfhosted.yml exec -T db \
  pg_dump -U postgres postgres | gzip > "$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql.gz"

# Delete old backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Optional: Upload to S3
# aws s3 cp "$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql.gz" s3://your-bucket/backups/
EOF

chmod +x /usr/local/bin/backup-db.sh

# Add to crontab (daily at 2 AM)
echo "0 2 * * * /usr/local/bin/backup-db.sh >> /var/log/backup.log 2>&1" | crontab -
```

### Database Restore

```bash
# Stop the application first
docker compose -f docker-compose.selfhosted.yml stop app

# Restore from backup
gunzip < backup_20240115.sql.gz | \
  docker compose -f docker-compose.selfhosted.yml exec -T db \
  psql -U postgres postgres

# Or without compression
docker compose -f docker-compose.selfhosted.yml exec -T db \
  psql -U postgres postgres < backup_20240115.sql

# Restart application
docker compose -f docker-compose.selfhosted.yml start app
```

### Full System Backup

```bash
# Backup everything (code, config, database)
tar -czvf aca-backup-$(date +%Y%m%d).tar.gz \
  --exclude='node_modules' \
  --exclude='.next' \
  /path/to/ACABarcodeScanner

# Backup Docker volumes
docker run --rm \
  -v acabarcodescanner_db-data:/data \
  -v $(pwd):/backup \
  alpine tar -czvf /backup/db-volume-$(date +%Y%m%d).tar.gz /data
```

---

## Troubleshooting

### Common Issues

#### Container Won't Start

```bash
# Check logs for errors
docker compose -f docker-compose.selfhosted.yml logs app

# Check if ports are in use
sudo lsof -i :3000
sudo lsof -i :5432

# Rebuild from scratch
docker compose -f docker-compose.selfhosted.yml down -v
docker compose -f docker-compose.selfhosted.yml up -d --build
```

#### Database Connection Errors

```bash
# Check if database is running
docker compose -f docker-compose.selfhosted.yml ps db

# Check database health
docker compose -f docker-compose.selfhosted.yml exec db pg_isready -U postgres

# View database logs
docker compose -f docker-compose.selfhosted.yml logs db

# Connect directly to verify
docker compose -f docker-compose.selfhosted.yml exec db psql -U postgres -c "SELECT 1"
```

#### Authentication Errors

- Verify `JWT_SECRET` is identical across all services
- Check that `ANON_KEY` and `SERVICE_ROLE_KEY` were generated with the correct `JWT_SECRET`
- View auth service logs:
  ```bash
  docker compose -f docker-compose.selfhosted.yml logs auth
  ```

#### SSL Certificate Issues

```bash
# Check Caddy logs
docker compose -f docker-compose.selfhosted.yml logs caddy

# Verify DNS is pointing correctly
dig your-domain.com

# Test SSL manually
openssl s_client -connect your-domain.com:443

# Force certificate renewal
docker compose -f docker-compose.selfhosted.yml exec caddy caddy reload
```

#### Memory Issues

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

### Getting Help

1. Check container logs first
2. Search existing GitHub issues
3. Create a new issue with:
   - Docker compose file used
   - Relevant logs (sanitize secrets!)
   - Steps to reproduce

---

## Security Recommendations

### Essential Security Measures

1. **Never commit secrets**
   - Use `.env.example` as templates
   - Add `.env*` to `.gitignore`

2. **Use strong passwords**
   ```bash
   # Generate secure passwords
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
   # Update host OS
   sudo apt update && sudo apt upgrade -y

   # Update Docker images
   docker compose -f docker-compose.selfhosted.yml pull
   docker compose -f docker-compose.selfhosted.yml up -d
   ```

5. **Use SSH keys, disable password auth**
   ```bash
   # /etc/ssh/sshd_config
   PasswordAuthentication no
   PubkeyAuthentication yes
   ```

6. **Regular backups** (see Backup & Restore section)

7. **Monitor access logs**
   ```bash
   # View recent SSH attempts
   sudo tail -f /var/log/auth.log
   ```

### Security Checklist

- [ ] All secrets are generated (not default values)
- [ ] `.env` files are not committed to git
- [ ] Firewall is enabled with minimal open ports
- [ ] SSH uses key authentication only
- [ ] Database is not exposed publicly (port 5432 closed)
- [ ] HTTPS is enabled in production
- [ ] Supabase Studio is protected (not public)
- [ ] Regular backups are configured
- [ ] System updates are scheduled

---

## Environment Variables Reference

### Backend Provider Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_PROVIDER` | No | supabase | Database provider: `supabase` or `prisma` |
| `AUTH_PROVIDER` | No | supabase | Auth provider: `supabase` or `nextauth` |
| `NEXT_PUBLIC_AUTH_PROVIDER` | No | supabase | Client-side auth provider (must match AUTH_PROVIDER) |

### Supabase Mode Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes* | - | Supabase API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes* | - | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes* | - | Supabase service role key |

*Required when `DATABASE_PROVIDER=supabase`

### Prisma/NextAuth Mode Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes** | - | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes** | - | NextAuth.js session secret |
| `NEXTAUTH_URL` | Yes** | - | Base URL for NextAuth callbacks |
| `POSTGRES_USER` | No | postgres | PostgreSQL username (Docker) |
| `POSTGRES_PASSWORD` | Yes** | - | PostgreSQL password (Docker) |
| `POSTGRES_DB` | No | lunch_scanner | PostgreSQL database name (Docker) |

**Required when `DATABASE_PROVIDER=prisma`

### Application Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_SITE_URL` | Yes | - | Public URL of your application |
| `CRON_SECRET` | No | - | Secret for cron job authentication |
| `PORT` | No | 3000 | Port for the application |
| `NODE_ENV` | No | production | Node environment |

### SMTP Variables (Optional)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SMTP_HOST` | No | - | SMTP server hostname |
| `SMTP_PORT` | No | 587 | SMTP port |
| `SMTP_USER` | No | - | SMTP username |
| `SMTP_PASS` | No | - | SMTP password |
| `SMTP_ADMIN_EMAIL` | No | - | Admin email address |
| `SMTP_SENDER_NAME` | No | ACA Barcode Scanner | Email sender name |
