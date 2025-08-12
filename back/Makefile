.PHONY: help build up down logs restart clean migrate backup

# Default target
help: ## Show this help message
	@echo "ALCN Backend Docker Commands:"
	@echo "============================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

# Main commands
up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

rebuild: ## Rebuild and restart all services
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d

# General commands
build: ## Build backend image
	docker-compose build

up: ## Start services (basic)
	docker-compose up -d

down: ## Stop all services
	docker-compose down

logs: ## Show logs for all services
	docker-compose logs

logs-backend: ## Show backend logs
	docker-compose logs -f backend

logs-db: ## Show database logs
	docker-compose logs -f db

restart: ## Restart all services
	docker-compose restart

# Database commands
migrate: ## Run database migrations
	docker-compose exec backend uv run alembic upgrade head

migrate-create: ## Create new migration (usage: make migrate-create MSG="migration description")
	docker-compose exec backend uv run alembic revision --autogenerate -m "$(MSG)"

db-shell: ## Connect to database shell
	docker-compose exec db psql -U ${POSTGRES_USER} -d ${POSTGRES_DB}

backup: ## Create database backup
	docker-compose exec db pg_dump -U ${POSTGRES_USER} -d ${POSTGRES_DB} > backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Backup created: backup_$$(date +%Y%m%d_%H%M%S).sql"

restore: ## Restore database from backup (usage: make restore FILE=backup.sql)
	@if [ -z "$(FILE)" ]; then echo "Usage: make restore FILE=backup.sql"; exit 1; fi
	docker-compose exec -T db psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} < $(FILE)

# Backend commands
shell: ## Access backend container shell
	docker-compose exec backend bash

test: ## Run backend tests
	docker-compose exec backend uv run pytest

# Cleanup commands
clean: ## Clean up unused Docker resources
	docker-compose down -v --remove-orphans
	docker system prune -f

clean-all: ## Clean up everything including images and volumes
	docker-compose down -v --remove-orphans
	docker system prune -af
	docker volume prune -f

# Status commands
status: ## Show container status
	docker-compose ps

health: ## Check service health
	@echo "=== Backend Health Check ==="
	@curl -f http://localhost:8000/health 2>/dev/null && echo "✅ Backend healthy" || echo "❌ Backend unhealthy"
	@echo ""
	@echo "=== Database Health Check ==="
	@docker-compose exec db pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB} && echo "✅ Database healthy" || echo "❌ Database unhealthy"

# Quick setup for new environment
setup: ## Complete setup for new environment
	@echo "🚀 Setting up ALCN backend environment..."
	@if [ ! -f .env ]; then \
		echo "📝 Creating .env file from template..."; \
		cp .env.example .env; \
		echo ""; \
		echo "🚨 CRITICAL SECURITY STEP:"; \
		echo "   Please edit .env file with YOUR OWN secure credentials!"; \
		echo "   - Replace ALL placeholder values"; \
		echo "   - Generate new SECRET_KEY"; \
		echo "   - Use strong database passwords"; \
		echo "   - Add your Vercel URLs"; \
		echo "   - NEVER use example values!"; \
		echo ""; \
		exit 1; \
	fi
	@echo "1. Building backend image..."
	docker-compose build
	@echo "2. Starting services..."
	docker-compose up -d
	@echo "3. Waiting for services to be ready..."
	@sleep 20
	@echo "4. Running database migrations..."
	docker-compose exec backend uv run alembic upgrade head
	@echo ""
	@echo "✅ Setup complete!"
	@echo "🔗 API: http://localhost:8000"
	@echo "📖 Docs: http://localhost:8000/docs"
	@echo "🗄️ DB: localhost:5432"

# Environment setup
env-setup: ## Create .env file from template
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "✅ Created .env file from template"; \
		echo "📝 Please edit .env with your Vercel URLs"; \
	else \
		echo "⚠️  .env file already exists"; \
	fi