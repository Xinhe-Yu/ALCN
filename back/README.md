# From the project root directory
To run FastAPI app:

`uv run uvicorn app.main:app --reload`

# 2. Check what migrations need to run
uv run alembic current                    # Show current version
uv run alembic history                    # Show all migrations
uv run alembic show head                  # Show latest migration

# 3. Backup database (ALWAYS!)
pg_dump -U xinhe -h localhost -p 5432 alcn > backup_$(date +%Y%m%d_%H%M%S).sql

# 4. Run migrations
uv run alembic upgrade head

# 5. Verify migration success
uv run alembic current                    # Should show latest revision
