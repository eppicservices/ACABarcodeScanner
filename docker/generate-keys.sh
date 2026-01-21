#!/bin/bash

# ===========================================
# Generate Supabase API Keys
# ===========================================
# This script generates the JWT tokens needed for self-hosted Supabase
# Usage: ./docker/generate-keys.sh

set -e

echo "==================================================="
echo "Supabase Self-Hosted Key Generator"
echo "==================================================="
echo ""

# Check if jq and openssl are available
command -v openssl >/dev/null 2>&1 || { echo "Error: openssl is required but not installed."; exit 1; }

# Generate random secrets
echo "Generating secrets..."
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d '/+=' | cut -c1-32)
JWT_SECRET=$(openssl rand -base64 32 | tr -d '/+=' | cut -c1-32)
CRON_SECRET=$(openssl rand -hex 32)
SECRET_KEY_BASE=$(openssl rand -base64 64 | tr -d '\n')

echo ""
echo "==================================================="
echo "Generated Secrets"
echo "==================================================="
echo ""
echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD"
echo ""
echo "JWT_SECRET=$JWT_SECRET"
echo ""
echo "CRON_SECRET=$CRON_SECRET"
echo ""
echo "SECRET_KEY_BASE=$SECRET_KEY_BASE"
echo ""
echo "==================================================="
echo "JWT Tokens"
echo "==================================================="
echo ""
echo "To generate your ANON_KEY and SERVICE_ROLE_KEY, use the JWT secret above"
echo "at https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys"
echo ""
echo "Or use this Node.js script:"
echo ""
echo "  const jwt = require('jsonwebtoken');"
echo "  const secret = '$JWT_SECRET';"
echo "  "
echo "  // Anon key"
echo "  console.log('ANON_KEY=' + jwt.sign({ role: 'anon', iss: 'supabase' }, secret, { expiresIn: '10y' }));"
echo "  "
echo "  // Service role key"
echo "  console.log('SERVICE_ROLE_KEY=' + jwt.sign({ role: 'service_role', iss: 'supabase' }, secret, { expiresIn: '10y' }));"
echo ""
echo "==================================================="
echo "Next Steps"
echo "==================================================="
echo ""
echo "1. Copy .env.selfhosted.example to .env"
echo "2. Replace the placeholder values with the secrets above"
echo "3. Generate your JWT tokens using the method above"
echo "4. Run: docker compose -f docker-compose.selfhosted.yml up -d"
echo ""
