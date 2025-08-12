"""make_entry_type_nullable_and_add_translator_id_to_sources

Revision ID: 188161567497
Revises: 46e2f7702d2b
Create Date: 2025-08-08 21:57:43.454792

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '188161567497'
down_revision: Union[str, Sequence[str], None] = '46e2f7702d2b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Make entries.entry_type nullable (remove NOT NULL constraint)
    op.alter_column('entries', 'entry_type',
                    existing_type=sa.VARCHAR(length=20),
                    nullable=True)
    
    # Add translator_id column to sources table as foreign key to users
    op.add_column('sources', sa.Column('translator_id', 
                                      sa.dialects.postgresql.UUID(as_uuid=True), 
                                      nullable=True))
    op.create_foreign_key('fk_sources_translator_id', 'sources', 'users', 
                         ['translator_id'], ['id'])


def downgrade() -> None:
    """Downgrade schema."""
    # Remove translator_id column and foreign key from sources table
    op.drop_constraint('fk_sources_translator_id', 'sources', type_='foreignkey')
    op.drop_column('sources', 'translator_id')
    
    # Make entries.entry_type NOT NULL again
    op.alter_column('entries', 'entry_type',
                    existing_type=sa.VARCHAR(length=20),
                    nullable=False)
