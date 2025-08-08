"""initial_schema_from_sql

Revision ID: 81f1891a8234
Revises: 4281af1665d0
Create Date: 2025-08-08 19:28:41.494621

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '4281af1665d0'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create users table
    op.create_table(
        'users',
        sa.Column(
            'id',
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text('gen_random_uuid()')
        ),
        sa.Column('email', sa.String(255), unique=True, nullable=False),
        sa.Column(
            'role',
            sa.String(50),
            nullable=False,
            server_default='contributor'
        ),
        sa.Column(
            'is_activated',
            sa.Boolean(),
            default=False,
            server_default='false'
        ),
        sa.Column('userdata', postgresql.JSONB()),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.func.now()
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.func.now()
        ),
        sa.CheckConstraint(
            "role IN ('admin', 'verified_translator', 'contributor')",
            name='users_role_check'
        )
    )

    # Create verification_codes table
    op.create_table(
        'verification_codes',
        sa.Column(
            'id',
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text('gen_random_uuid()')
        ),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('code', sa.String(6), nullable=False),
        sa.Column(
            'expires_at',
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW() + INTERVAL '15 minutes'")
        ),
        sa.Column('used_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
    )

    # Create sources table
    op.create_table(
        'sources',
        sa.Column(
            'id',
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text('gen_random_uuid()')
        ),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('author', sa.String(255)),
        sa.Column('publisher', sa.String(255)),
        sa.Column('publication_year', sa.Integer()),
        sa.Column('language_code', sa.String(10), nullable=False),
        sa.Column('isbn', sa.String(20)),
        sa.Column('description', sa.Text()),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.func.now()
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.func.now()
        )
    )

    # Create entries table
    op.create_table(
        'entries',
        sa.Column(
            'id',
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text('gen_random_uuid()')
        ),
        sa.Column('primary_name', sa.String(500), nullable=False),
        sa.Column('original_script', sa.Text()),
        sa.Column('language_code', sa.String(10), nullable=False),
        sa.Column('entry_type', sa.String(20), nullable=False),
        sa.Column('alternative_names', postgresql.ARRAY(sa.Text())),
        sa.Column('etymology', sa.Text()),
        sa.Column('definition', sa.Text()),
        sa.Column('historical_context', sa.Text()),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('is_verified', sa.Boolean(), default=False, server_default='false'),
        sa.Column('verification_notes', sa.Text()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column(
            'search_vector',
            postgresql.TSVECTOR(),
            sa.Computed(
                "to_tsvector('english', COALESCE(primary_name, '') || ' ' || "
                "COALESCE(definition, '') || ' ' || COALESCE(etymology, ''))",
                persisted=True
            )
        ),
        sa.CheckConstraint(
            "entry_type IN ('term', 'personal_name', 'place_name', "
            "'artwork_title', 'concept')",
            name='entries_entry_type_check'
        ),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.ForeignKeyConstraint(['updated_by'], ['users.id'])
    )

    # Create translations table
    op.create_table(
        'translations',
        sa.Column(
            'id',
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text('gen_random_uuid()')
        ),
        sa.Column('entry_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('language_code', sa.String(10), nullable=False),
        sa.Column('translated_name', sa.String(500), nullable=False),
        sa.Column('notes', sa.Text()),
        sa.Column('source_id', postgresql.UUID(as_uuid=True)),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['entry_id'], ['entries.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['source_id'], ['sources.id']),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.ForeignKeyConstraint(['updated_by'], ['users.id']),
        sa.UniqueConstraint(
            'entry_id',
            'language_code',
            'translated_name',
            name='translations_entry_lang_name_unique'
        )
    )

    # Create comments table
    op.create_table(
        'comments',
        sa.Column(
            'id',
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text('gen_random_uuid()')
        ),
        sa.Column('entry_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('parent_comment_id', postgresql.UUID(as_uuid=True)),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('is_edited', sa.Boolean(), default=False, server_default='false'),
        sa.Column('edit_history', postgresql.JSONB()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['entry_id'], ['entries.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_comment_id'], ['comments.id'], ondelete='CASCADE')
    )

    # Create entry_relationships table
    op.create_table(
        'entry_relationships',
        sa.Column(
            'id',
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text('gen_random_uuid()')
        ),
        sa.Column('source_entry_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('target_entry_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('relationship_type', sa.String(50), nullable=False),
        sa.Column('notes', sa.Text()),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.CheckConstraint(
            "relationship_type IN ('synonym', 'antonym', 'related', 'variant', "
            "'see_also', 'broader_term', 'narrower_term', "
            "'cross_language_equivalent')",
            name='entry_relationships_relationship_type_check'
        ),
        sa.ForeignKeyConstraint(['source_entry_id'], ['entries.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['target_entry_id'], ['entries.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.UniqueConstraint(
            'source_entry_id',
            'target_entry_id',
            'relationship_type',
            name='entry_relationships_source_target_type_unique'
        )
    )

    # Create entry_history table
    op.create_table(
        'entry_history',
        sa.Column(
            'id',
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text('gen_random_uuid()')
        ),
        sa.Column('entry_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('changed_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('change_type', sa.String(20), nullable=False),
        sa.Column('old_values', postgresql.JSONB()),
        sa.Column('new_values', postgresql.JSONB()),
        sa.Column('change_reason', sa.Text()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.CheckConstraint(
            "change_type IN ('created', 'updated', 'verified', 'archived')",
            name='entry_history_change_type_check'
        ),
        sa.ForeignKeyConstraint(['entry_id'], ['entries.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['changed_by'], ['users.id'])
    )

    # Create indexes
    op.create_index('idx_entries_primary_name', 'entries', ['primary_name'])
    op.create_index('idx_entries_language_code', 'entries', ['language_code'])
    op.create_index(
        'idx_entries_search_vector',
        'entries',
        ['search_vector'],
        postgresql_using='gin'
    )
    op.create_index('idx_entries_created_by', 'entries', ['created_by'])
    op.create_index('idx_entries_created_at', 'entries', [sa.text('created_at DESC')])

    op.create_index('idx_translations_entry_id', 'translations', ['entry_id'])
    op.create_index('idx_translations_language', 'translations', ['language_code'])
    op.create_index(
        'idx_translations_source',
        'translations',
        ['source_id'],
        postgresql_where=sa.text('source_id IS NOT NULL')
    )
    op.create_index('idx_translations_name', 'translations', ['translated_name'])

    op.create_index('idx_comments_entry_id', 'comments', ['entry_id'])
    op.create_index('idx_comments_user_id', 'comments', ['user_id'])
    op.create_index(
        'idx_comments_parent',
        'comments',
        ['parent_comment_id'],
        postgresql_where=sa.text('parent_comment_id IS NOT NULL')
    )
    op.create_index('idx_comments_created_at', 'comments', [sa.text('created_at DESC')])

    op.create_index(
        'idx_verification_codes_user_expires',
        'verification_codes',
        ['user_id', 'expires_at']
    )
    op.create_index(
        'idx_verification_codes_code_active',
        'verification_codes',
        ['code'],
        postgresql_where=sa.text('used_at IS NULL')
    )

    op.create_index('idx_entry_relationships_source', 'entry_relationships', ['source_entry_id'])
    op.create_index('idx_entry_relationships_target', 'entry_relationships', ['target_entry_id'])
    op.create_index('idx_entry_relationships_type', 'entry_relationships', ['relationship_type'])

    # Create triggers and function
    op.execute("""
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
    """)

    op.execute(
        "CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users "
        "FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();"
    )
    op.execute(
        "CREATE TRIGGER update_sources_updated_at BEFORE UPDATE ON sources "
        "FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();"
    )
    op.execute(
        "CREATE TRIGGER update_entries_updated_at BEFORE UPDATE ON entries "
        "FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();"
    )
    op.execute(
        "CREATE TRIGGER update_translations_updated_at BEFORE UPDATE ON "
        "translations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();"
    )
    op.execute(
        "CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments "
        "FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();"
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop triggers
    op.execute("DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;")
    op.execute("DROP TRIGGER IF EXISTS update_translations_updated_at ON translations;")
    op.execute("DROP TRIGGER IF EXISTS update_entries_updated_at ON entries;")
    op.execute("DROP TRIGGER IF EXISTS update_sources_updated_at ON sources;")
    op.execute("DROP TRIGGER IF EXISTS update_users_updated_at ON users;")

    # Drop function
    op.execute("DROP FUNCTION IF EXISTS update_updated_at_column();")

    # Drop indexes (some will be dropped automatically with tables)
    op.drop_index(
        'idx_entry_relationships_type',
        table_name='entry_relationships'
    )
    op.drop_index(
        'idx_entry_relationships_target',
        table_name='entry_relationships'
    )
    op.drop_index(
        'idx_entry_relationships_source',
        table_name='entry_relationships'
    )
    op.drop_index(
        'idx_verification_codes_code_active',
        table_name='verification_codes'
    )
    op.drop_index(
        'idx_verification_codes_user_expires',
        table_name='verification_codes'
    )
    op.drop_index('idx_comments_created_at', table_name='comments')
    op.drop_index('idx_comments_parent', table_name='comments')
    op.drop_index('idx_comments_user_id', table_name='comments')
    op.drop_index('idx_comments_entry_id', table_name='comments')
    op.drop_index('idx_translations_name', table_name='translations')
    op.drop_index('idx_translations_source', table_name='translations')
    op.drop_index('idx_translations_language', table_name='translations')
    op.drop_index('idx_translations_entry_id', table_name='translations')
    op.drop_index('idx_entries_created_at', table_name='entries')
    op.drop_index('idx_entries_created_by', table_name='entries')
    op.drop_index('idx_entries_search_vector', table_name='entries')
    op.drop_index('idx_entries_language_code', table_name='entries')
    op.drop_index('idx_entries_primary_name', table_name='entries')

    # Drop tables (in reverse order due to foreign key constraints)
    op.drop_table('entry_history')
    op.drop_table('entry_relationships')
    op.drop_table('comments')
    op.drop_table('translations')
    op.drop_table('entries')
    op.drop_table('sources')
    op.drop_table('verification_codes')
    op.drop_table('users')
