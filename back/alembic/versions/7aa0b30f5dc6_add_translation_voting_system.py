"""add_translation_voting_system

This migration adds a comprehensive voting system for translations, similar to Urban Dictionary:
- Creates translation_votes table for individual user votes
- Adds upvotes/downvotes count columns to translations for performance
- Ensures one vote per user per translation with proper constraints
- Includes optimized indexes for scalability

Revision ID: 7aa0b30f5dc6
Revises: af352b600006
Create Date: 2025-08-09 13:30:47.695454

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = '7aa0b30f5dc6'
down_revision: Union[str, Sequence[str], None] = 'af352b600006'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add vote count columns to translations table
    op.add_column('translations', sa.Column('upvotes', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('translations', sa.Column('downvotes', sa.Integer(), nullable=False, server_default='0'))
    
    # Create translation_votes table
    op.create_table(
        'translation_votes',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('translation_id', UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), nullable=False),
        sa.Column('vote_type', sa.String(10), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        
        # Foreign key constraints
        sa.ForeignKeyConstraint(['translation_id'], ['translations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        
        # Check constraint for vote_type
        sa.CheckConstraint("vote_type IN ('up', 'down')", name='translation_votes_vote_type_check'),
        
        # Unique constraint: one vote per user per translation
        sa.UniqueConstraint('translation_id', 'user_id', name='translation_votes_translation_user_unique')
    )
    
    # Create indexes for performance
    op.create_index('idx_translation_votes_translation_id', 'translation_votes', ['translation_id'])
    op.create_index('idx_translation_votes_user_id', 'translation_votes', ['user_id'])
    op.create_index('idx_translation_votes_vote_type', 'translation_votes', ['vote_type'])


def downgrade() -> None:
    """Downgrade schema."""
    # Drop indexes
    op.drop_index('idx_translation_votes_vote_type', 'translation_votes')
    op.drop_index('idx_translation_votes_user_id', 'translation_votes')
    op.drop_index('idx_translation_votes_translation_id', 'translation_votes')
    
    # Drop translation_votes table
    op.drop_table('translation_votes')
    
    # Remove vote count columns from translations
    op.drop_column('translations', 'downvotes')
    op.drop_column('translations', 'upvotes')
