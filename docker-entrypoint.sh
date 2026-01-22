#!/bin/sh
set -e

echo "Starting ACA Barcode Scanner..."

# Wait for database to be ready
if [ -n "$DATABASE_URL" ]; then
    echo "Waiting for database to be ready..."

    # Extract host and port from DATABASE_URL
    # Format: postgresql://user:pass@host:port/db
    DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')

    # Default port if not found
    DB_PORT=${DB_PORT:-5432}

    # Wait for PostgreSQL to accept connections
    MAX_RETRIES=30
    RETRY_COUNT=0

    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
            echo "Database is ready!"
            break
        fi
        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo "Waiting for database... ($RETRY_COUNT/$MAX_RETRIES)"
        sleep 2
    done

    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        echo "Error: Could not connect to database after $MAX_RETRIES attempts"
        exit 1
    fi
fi

# Run migrations if RUN_MIGRATIONS is set
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "Running database migrations..."
    npx prisma migrate deploy
    echo "Migrations complete!"
fi

# Execute the main command
echo "Starting application..."
exec "$@"
