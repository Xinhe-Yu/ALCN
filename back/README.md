# From the project root directory
To run your FastAPI app:

uv run uvicorn app.main:app --reload

# 2. Check what migrations need to run
uv run alembic current                    # Show current version
uv run alembic history                    # Show all migrations
uv run alembic show head                  # Show latest migration

# 3. Backup database (ALWAYS!)
pg_dump greco_roman_dict > backup_$(date +%Y%m%d_%H%M%S).sql

# 4. Run migrations
uv run alembic upgrade head

# 5. Verify migration success
uv run alembic current                    # Should show latest revision
