"""add_trigram_extension

Revision ID: 4281af1665d0
Revises:
Create Date: 2025-08-08 18:47:32.891037

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '81f1891a8234'
down_revision: Union[str, Sequence[str], None] = '4281af1665d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Enable pg_trgm extension for trigram search
    op.execute('CREATE EXTENSION IF NOT EXISTS pg_trgm;')

    # Create trigram index on entries.primary_name
    op.execute(
        'CREATE INDEX IF NOT EXISTS idx_entries_primary_name_trgm '
        'ON entries USING GIN (primary_name gin_trgm_ops);'
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop trigram index
    op.execute('DROP INDEX IF EXISTS idx_entries_primary_name_trgm;')

    # Note: We don't drop the extension as it might be used by other parts
