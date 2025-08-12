# ALCN Backend Docker Setup

Simple Docker containerization for the ALCN (Ancient Lexicon CN) FastAPI backend for VPS deployment.

## Quick Start

### 1. Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 1GB available RAM

### 2. Setup Environment
```bash
cd back/
make env-setup
# 🚨 CRITICAL: Edit .env file with YOUR OWN secure credentials!
# - Replace ALL placeholder values
# - Use strong database passwords
# - Generate new SECRET_KEY
# - Add your real Vercel URLs
# - NEVER use example values in production!
```

### 3. First-time Setup
```bash
make setup
```

The API will be available at:
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Database**: localhost:5432

## Architecture

This Docker setup includes only the backend services needed:

### Services
- **backend** - FastAPI application (port 8000)
- **db** - PostgreSQL 15 database (port 5432/5433)

### Volumes
- `postgres_data` - Database persistent storage

## Configuration for Vercel Frontend

### 1. Update CORS Origins
Edit `docker-compose.yml` or `docker-compose.prod.yml` and update:
```yaml
environment:
  BACKEND_CORS_ORIGINS: '["https://your-app.vercel.app", "https://your-custom-domain.com"]'
```

### 2. Frontend API Configuration
In your Vercel frontend, set the API base URL to:
- **Local development**: `http://localhost:8000`
- **Production**: Your backend deployment URL

## Available Commands

### Main Operations
```bash
make up           # Start all services
make down         # Stop all services  
make restart      # Restart all services
make rebuild      # Rebuild and restart
make logs         # Show all service logs
```

### Database Operations
```bash
make migrate      # Run database migrations
make migrate-create MSG="description"  # Create new migration
make db-shell     # Connect to database shell
make backup       # Create database backup
make restore FILE=backup.sql  # Restore from backup
```

### Maintenance
```bash
make status       # Show container status
make health       # Check service health
make clean        # Clean up unused resources
make clean-all    # Clean everything including images
```

## Development Workflow

### 1. Start Development
```bash
make dev
```
This starts:
- PostgreSQL database on port 5433
- FastAPI with hot reload
- Code mounted as volume for instant updates

### 2. Make Database Changes
```bash
# Create migration after model changes
make migrate-create MSG="add new field"

# Apply migrations
make migrate
```

### 3. View Logs
```bash
make dev-logs
```

### 4. Test API
Visit http://localhost:8000/docs for interactive API documentation

## Production Deployment

### 1. Environment Configuration
Create production `.env`:
```bash
cp .env.docker .env.prod
```

Update production values:
- Strong database passwords
- Production secret keys
- Your Vercel frontend URLs in CORS origins
- Email configuration

### 2. Deploy Production
```bash
make prod
```

### 3. Health Check
```bash
make health
```

## Environment Variables

Key environment variables for deployment:

```bash
# Database
DATABASE_URL=postgresql://xinhe:password@db:5432/alcn

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com

# CORS for Vercel
BACKEND_CORS_ORIGINS=["https://your-app.vercel.app"]

# Environment
ENVIRONMENT=production
```

## Vercel Integration

### Frontend Configuration
In your Vercel frontend project, set these environment variables:

```bash
# For local development
NEXT_PUBLIC_API_URL=http://localhost:8000

# For production (update with your backend URL)
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
```

### API Calls Example
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const response = await fetch(`${API_BASE_URL}/api/v1/entries`);
```

## Monitoring

### Health Checks
All services include health checks:
- Backend: `curl http://localhost:8000/health`
- Database: `pg_isready`

### Logs
```bash
# Real-time logs
make logs

# Specific service
make logs-backend
make logs-db
```

### Resource Usage
```bash
docker stats
```

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
make logs-db
make db-shell  # Test connection
```

#### Backend Issues  
```bash
make logs-backend
make shell     # Access container
```

#### CORS Issues
Update CORS origins in docker-compose files to include your Vercel URLs.

#### Port Conflicts
Development uses port 5433 for database to avoid conflicts.

### Clean Reset
```bash
make clean-all  # Nuclear option
make setup      # Fresh start
```

## Security Notes

### Production Security
- Change all default passwords
- Use environment-specific secrets  
- Update CORS origins for your domain
- Use HTTPS in production
- Regular security updates

### Database Security
- Strong passwords
- Don't expose database ports in production
- Regular backups
- Connection encryption

## Backup Strategy

### Automated Backups
```bash
# Add to crontab for daily backups
0 2 * * * cd /path/to/back && make backup
```

### Manual Backup
```bash
make backup  # Creates timestamped backup file
```

### Restore
```bash
make restore FILE=backup_20240101_120000.sql
```

## Security Setup

### 🚨 IMPORTANT: Change Default Credentials!

Before deploying, **MUST** change these in your `.env` file:

1. **Database Credentials:**
```bash
POSTGRES_USER=your_secure_username
POSTGRES_PASSWORD=your_very_secure_password_123
```

2. **Generate New Secret Key:**
```bash
python -c "import secrets; print(secrets.token_hex(32))"
# Copy output to SECRET_KEY in .env
```

3. **Update Database URL:**
```bash
DATABASE_URL=postgresql://your_secure_username:your_very_secure_password_123@db:5432/alcn
```

### 🔒 Production Security Checklist:
- [ ] Changed database username/password
- [ ] Generated new SECRET_KEY  
- [ ] Updated DATABASE_URL with new credentials
- [ ] Added your Vercel URLs to CORS origins
- [ ] Removed any test/default credentials
- [ ] Used strong passwords (12+ characters, mixed case, numbers, symbols)

## File Structure

```
back/
├── Dockerfile                 # Backend container image
├── docker-compose.yml         # Single services configuration
├── .dockerignore              # Docker build exclusions
├── .env.example               # Environment template (copy to .env)
├── Makefile                   # Docker management commands
└── README.Docker.md           # This file
```

## Support

For issues:
1. Check health: `make health`
2. View logs: `make logs`
3. Clean reset: `make clean-all && make setup`
4. Check container status: `make status`