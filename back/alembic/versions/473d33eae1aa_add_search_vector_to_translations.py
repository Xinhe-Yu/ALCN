"""add_search_vector_to_translations

Revision ID: 473d33eae1aa
Revises: 1409c7ccbf72
Create Date: 2025-08-11 22:31:03.559832

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import TSVECTOR


# revision identifiers, used by Alembic.
revision: str = '473d33eae1aa'
down_revision: Union[str, Sequence[str], None] = '1409c7ccbf72'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # First, drop the existing generated search_vector column in entries to recreate it with more fields
    op.drop_column('entries', 'search_vector')
    
    # Add regular search_vector column to entries (nullable first)
    op.add_column('entries', sa.Column('search_vector', TSVECTOR))
    
    # Add search_vector column to translations table (nullable first)
    op.add_column('translations', sa.Column('search_vector', TSVECTOR))
    
    # Create trigger function for entries search vector
    op.execute("""
    CREATE OR REPLACE FUNCTION update_entry_search_vector() RETURNS TRIGGER AS $$
    BEGIN
        NEW.search_vector := 
            setweight(to_tsvector('english', COALESCE(NEW.primary_name, '')), 'A') ||
            setweight(to_tsvector('english', COALESCE(NEW.original_script, '')), 'B') ||
            setweight(to_tsvector('english', COALESCE(array_to_string(NEW.alternative_names, ' '), '')), 'B') ||
            setweight(to_tsvector('english', COALESCE(NEW.etymology, '')), 'C') ||
            setweight(to_tsvector('english', COALESCE(NEW.definition, '')), 'C') ||
            setweight(to_tsvector('english', COALESCE(NEW.historical_context, '')), 'C');
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)
    
    # Create trigger function for translations search vector  
    op.execute("""
    CREATE OR REPLACE FUNCTION update_translation_search_vector() RETURNS TRIGGER AS $$
    BEGIN
        NEW.search_vector := 
            setweight(to_tsvector('english', COALESCE(NEW.translated_name, '')), 'A') ||
            setweight(to_tsvector('english', COALESCE(NEW.notes, '')), 'B');
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)
    
    # Create triggers
    op.execute("""
    CREATE TRIGGER update_entry_search_vector_trigger
        BEFORE INSERT OR UPDATE ON entries
        FOR EACH ROW EXECUTE FUNCTION update_entry_search_vector();
    """)
    
    op.execute("""
    CREATE TRIGGER update_translation_search_vector_trigger
        BEFORE INSERT OR UPDATE ON translations
        FOR EACH ROW EXECUTE FUNCTION update_translation_search_vector();
    """)
    
    # Update existing entries search vectors
    op.execute("""
    UPDATE entries SET search_vector = 
        setweight(to_tsvector('english', COALESCE(primary_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(original_script, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(alternative_names, ' '), '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(etymology, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(definition, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(historical_context, '')), 'C');
    """)
    
    # Update existing translations search vectors
    op.execute("""
    UPDATE translations SET search_vector = 
        setweight(to_tsvector('english', COALESCE(translated_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(notes, '')), 'B');
    """)
    
    # Make search_vector columns NOT NULL after populating data
    op.alter_column('entries', 'search_vector', nullable=False)
    op.alter_column('translations', 'search_vector', nullable=False)
    
    # Add GIN indexes for both search vectors
    op.create_index('idx_entries_search_vector', 'entries', ['search_vector'], postgresql_using='gin')
    op.create_index('idx_translations_search_vector', 'translations', ['search_vector'], postgresql_using='gin')


def downgrade() -> None:
    """Downgrade schema."""
    # Drop triggers
    op.execute("DROP TRIGGER IF EXISTS update_translation_search_vector_trigger ON translations;")
    op.execute("DROP TRIGGER IF EXISTS update_entry_search_vector_trigger ON entries;")
    
    # Drop functions
    op.execute("DROP FUNCTION IF EXISTS update_translation_search_vector();")
    op.execute("DROP FUNCTION IF EXISTS update_entry_search_vector();")
    
    # Drop indexes
    op.drop_index('idx_translations_search_vector')
    op.drop_index('idx_entries_search_vector')
    
    # Drop search_vector column from translations
    op.drop_column('translations', 'search_vector')
    
    # Drop and recreate original entries search_vector
    op.drop_column('entries', 'search_vector')
    op.execute("""
    ALTER TABLE entries ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', COALESCE(primary_name, ''::character varying)::text || ' ' || COALESCE(definition, '') || ' ' || COALESCE(etymology, ''))
    ) STORED;
    """)
    op.create_index('idx_entries_search_vector', 'entries', ['search_vector'], postgresql_using='gin')
