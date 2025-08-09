"""add_is_preferred_to_translations

This migration adds an `is_preferred` boolean column to the translations table
to mark preferred translations. Preferred translations will be sorted first
in the translations array for each entry.

- Adds `is_preferred` column (Boolean, default False)
- Creates index on `is_preferred` for better query performance
- Updates Entry.translations relationship to order by is_preferred DESC, created_at ASC

Revision ID: af352b600006
Revises: 188161567497
Create Date: 2025-08-09 11:58:35.643936

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'af352b600006'
down_revision: Union[str, Sequence[str], None] = '188161567497'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add is_preferred column to translations table
    op.add_column('translations', 
                  sa.Column('is_preferred', sa.Boolean(), 
                           nullable=False, server_default='false'))
    
    # Create index for is_preferred column for better query performance
    op.create_index('idx_translations_preferred', 'translations', ['is_preferred'])


def downgrade() -> None:
    """Downgrade schema."""
    # Drop index first
    op.drop_index('idx_translations_preferred', 'translations')
    
    # Remove is_preferred column from translations table
    op.drop_column('translations', 'is_preferred')
