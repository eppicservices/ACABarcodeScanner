# ============================================
# ACA Barcode Scanner - Makefile
# ============================================
# Usage: make <target>
# Run `make help` to see all available commands

.PHONY: help dev dev-db dev-db-down dev-db-reset build start lint \
        docker-build docker-push deploy logs logs-app logs-db \
        migrate migrate-dev migrate-reset seed studio backup restore clean

# Default target
.DEFAULT_GOAL := help

# ============================================
# Variables
# ============================================
DOCKER_REGISTRY ?= ghcr.io
DOCKER_IMAGE ?= $(DOCKER_REGISTRY)/$(shell basename $(CURDIR) | tr '[:upper:]' '[:lower:]')
DOCKER_TAG ?= latest
COMPOSE_FILE ?= docker-compose.yml
COMPOSE_DEV_FILE ?= docker-compose.dev.yml

# Colors for help output
BLUE := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RESET := \033[0m

# ============================================
# Help
# ============================================
help: ## Show this help message
	@echo ""
	@echo "$(GREEN)ACA Barcode Scanner$(RESET) - Available Commands"
	@echo ""
	@echo "$(YELLOW)Development:$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -E '(dev|lint|studio)' | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(BLUE)%-18s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)Database:$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -E '(migrate|seed|backup|restore)' | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(BLUE)%-18s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)Docker & Build:$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -E '(build|docker|deploy)' | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(BLUE)%-18s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)Production:$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -E '(logs|clean|prod)' | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(BLUE)%-18s$(RESET) %s\n", $$1, $$2}'
	@echo ""

# ============================================
# Development
# ============================================
dev: dev-db ## Start development environment (db + app with hot reload)
	npm run dev

dev-db: ## Start development database only
	docker compose -f $(COMPOSE_DEV_FILE) up -d
	@echo "$(GREEN)Database started. Waiting for health check...$(RESET)"
	@sleep 3
	@docker compose -f $(COMPOSE_DEV_FILE) ps

dev-db-down: ## Stop development database
	docker compose -f $(COMPOSE_DEV_FILE) down

dev-db-reset: ## Reset development database (removes all data)
	docker compose -f $(COMPOSE_DEV_FILE) down -v
	docker compose -f $(COMPOSE_DEV_FILE) up -d
	@echo "$(GREEN)Database reset. Run 'make migrate-dev' to apply migrations.$(RESET)"

dev-admin: ## Start development database with pgAdmin
	docker compose -f $(COMPOSE_DEV_FILE) --profile admin up -d
	@echo "$(GREEN)pgAdmin available at http://localhost:5050$(RESET)"

lint: ## Run ESLint
	npm run lint

studio: ## Open Prisma Studio (database GUI)
	npx prisma studio

# ============================================
# Database Operations
# ============================================
migrate: ## Run database migrations (production)
	docker compose exec app npx prisma migrate deploy

migrate-dev: ## Run database migrations (development)
	npx prisma migrate dev

migrate-reset: ## Reset database and run all migrations (WARNING: destroys data)
	npx prisma migrate reset

migrate-status: ## Check migration status
	npx prisma migrate status

seed: ## Seed the database with test data
	npx prisma db seed

backup: ## Create database backup
	@mkdir -p backups
	docker compose exec -T postgres pg_dump -U postgres lunch_scanner | gzip > backups/backup-$$(date +%Y%m%d-%H%M%S).sql.gz
	@echo "$(GREEN)Backup created in ./backups/$(RESET)"

restore: ## Restore database from backup (usage: make restore FILE=backups/backup-xxx.sql.gz)
ifndef FILE
	@echo "$(YELLOW)Usage: make restore FILE=backups/backup-xxx.sql.gz$(RESET)"
	@exit 1
endif
	docker compose stop app
	gunzip < $(FILE) | docker compose exec -T postgres psql -U postgres lunch_scanner
	docker compose start app
	@echo "$(GREEN)Database restored from $(FILE)$(RESET)"

# ============================================
# Build
# ============================================
build: ## Build Next.js application locally
	npm run build

docker-build: ## Build Docker image
	docker build -t $(DOCKER_IMAGE):$(DOCKER_TAG) .
	@echo "$(GREEN)Built $(DOCKER_IMAGE):$(DOCKER_TAG)$(RESET)"

docker-build-no-cache: ## Build Docker image without cache
	docker build --no-cache -t $(DOCKER_IMAGE):$(DOCKER_TAG) .

docker-push: ## Push Docker image to registry
	docker push $(DOCKER_IMAGE):$(DOCKER_TAG)
	@echo "$(GREEN)Pushed $(DOCKER_IMAGE):$(DOCKER_TAG)$(RESET)"

# ============================================
# Production Deployment
# ============================================
deploy: ## Deploy to production (pull latest, rebuild, restart)
	git pull origin main
	docker compose -f $(COMPOSE_FILE) up -d --build
	@echo "$(GREEN)Deployment complete!$(RESET)"
	@make logs-app

prod-up: ## Start production services
	docker compose -f $(COMPOSE_FILE) up -d
	@echo "$(GREEN)Production services started$(RESET)"
	docker compose -f $(COMPOSE_FILE) ps

prod-down: ## Stop production services
	docker compose -f $(COMPOSE_FILE) down

prod-restart: ## Restart production services
	docker compose -f $(COMPOSE_FILE) restart

prod-status: ## Show production services status
	docker compose -f $(COMPOSE_FILE) ps

# ============================================
# Logs
# ============================================
logs: ## Follow all container logs
	docker compose -f $(COMPOSE_FILE) logs -f

logs-app: ## Follow app container logs
	docker compose -f $(COMPOSE_FILE) logs -f app

logs-db: ## Follow database container logs
	docker compose -f $(COMPOSE_FILE) logs -f postgres

logs-caddy: ## Follow Caddy (web server) logs
	docker compose -f $(COMPOSE_FILE) logs -f caddy

# ============================================
# Utilities
# ============================================
clean: ## Clean build artifacts and Docker resources
	rm -rf .next node_modules/.cache
	docker system prune -f
	@echo "$(GREEN)Cleaned build artifacts and Docker cache$(RESET)"

clean-all: ## Deep clean (WARNING: removes all Docker volumes)
	rm -rf .next node_modules/.cache
	docker compose -f $(COMPOSE_FILE) down -v
	docker compose -f $(COMPOSE_DEV_FILE) down -v
	docker system prune -af
	@echo "$(YELLOW)Deep clean complete. All Docker volumes removed.$(RESET)"

shell-app: ## Open shell in app container
	docker compose exec app sh

shell-db: ## Open psql shell in database container
	docker compose exec postgres psql -U postgres lunch_scanner

health: ## Check application health
	@curl -s http://localhost:3000/api/health | jq . || echo "App not responding"

install: ## Install npm dependencies
	npm ci

setup: ## Initial project setup (install deps, copy env, start db, migrate)
	@echo "$(GREEN)Setting up development environment...$(RESET)"
	npm ci
	@test -f .env.local || cp .env.development.example .env.local
	docker compose -f $(COMPOSE_DEV_FILE) up -d
	@sleep 3
	npx prisma migrate dev
	@echo ""
	@echo "$(GREEN)Setup complete! Run 'make dev' to start developing.$(RESET)"
