"""add_other_language_codes_to_entries

Revision ID: 46e2f7702d2b
Revises: 81f1891a8234
Create Date: 2025-08-08 19:58:03.163622

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '46e2f7702d2b'
down_revision: Union[str, Sequence[str], None] = '81f1891a8234'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add other_language_codes array field to entries table."""
    # Add other_language_codes column as array of strings
    op.add_column(
        'entries',
        sa.Column(
            'other_language_codes',
            postgresql.ARRAY(sa.String(10)),
            nullable=True,
            comment='Additional language codes for entries with multiple language sources'
        )
    )
    
    # Create an index for better performance when querying by other_language_codes
    op.create_index(
        'idx_entries_other_language_codes',
        'entries',
        ['other_language_codes'],
        postgresql_using='gin'
    )


def downgrade() -> None:
    """Remove other_language_codes field from entries table."""
    # Drop the index first
    op.drop_index('idx_entries_other_language_codes', table_name='entries')
    
    # Drop the column
    op.drop_column('entries', 'other_language_codes')
