from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
    CheckConstraint,
    UniqueConstraint,
    Index
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB, TSVECTOR
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import text
import uuid

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    role = Column(
        String(50),
        nullable=False,
        default="contributor",
        server_default="contributor"
    )
    is_activated = Column(Boolean, default=False, server_default="false")
    userdata = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())
    username = Column(String(100), nullable=True)

    __table_args__ = (
        CheckConstraint(
            "role IN ('admin', 'verified_translator', 'contributor')",
            name="users_role_check"
        ),
    )

    # Relationships
    verification_codes = relationship("VerificationCode", back_populates="user")
    created_entries = relationship(
        "Entry", foreign_keys="Entry.created_by", back_populates="creator"
    )
    updated_entries = relationship(
        "Entry", foreign_keys="Entry.updated_by", back_populates="updater"
    )
    created_translations = relationship(
        "Translation", foreign_keys="Translation.created_by",
        back_populates="creator"
    )
    updated_translations = relationship(
        "Translation", foreign_keys="Translation.updated_by",
        back_populates="updater"
    )
    comments = relationship("Comment", back_populates="user")
    entry_relationships = relationship(
        "EntryRelationship", back_populates="created_by_user"
    )
    entry_history = relationship("EntryHistory", back_populates="changed_by_user")
    translated_sources = relationship("Source", back_populates="translator")
    translation_votes = relationship("TranslationVote", back_populates="user")


class VerificationCode(Base):
    __tablename__ = "verification_codes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
                     nullable=False)
    code = Column(String(6), nullable=False)
    expires_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("NOW() + INTERVAL '15 minutes'")
    )
    used_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="verification_codes")


class Source(Base):
    __tablename__ = "sources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(500), nullable=False)
    author = Column(String(255))
    publisher = Column(String(255))
    publication_year = Column(Integer)
    language_code = Column(String(10), nullable=False)
    isbn = Column(String(20))
    description = Column(Text)
    translator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    translator = relationship("User", back_populates="translated_sources")
    translations = relationship("Translation", back_populates="source")


class Entry(Base):
    __tablename__ = "entries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    primary_name = Column(String(500), nullable=False)
    original_script = Column(Text)
    language_code = Column(String(10), nullable=False)
    entry_type = Column(String(20), nullable=True)
    alternative_names = Column(ARRAY(Text))
    other_language_codes = Column(ARRAY(String(10)))
    etymology = Column(Text)
    definition = Column(Text)
    historical_context = Column(Text)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    is_verified = Column(Boolean, default=False, server_default="false")
    verification_notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())
    search_vector = Column(TSVECTOR, nullable=False)

    __table_args__ = (
        CheckConstraint(
            "entry_type IN ('term', 'personal_name', 'place_name', "
            "'artwork_title', 'concept', '')",
            name="entries_entry_type_check"
        ),
        Index('idx_entries_primary_name', 'primary_name'),
        Index('idx_entries_language_code', 'language_code'),
        Index('idx_entries_type', 'entry_type'),
        # Index('idx_entries_search_vector', 'search_vector', postgresql_using='gin'),
        Index('idx_entries_created_by', 'created_by'),
        Index('idx_entries_created_at', 'created_at'),
        Index(
            'idx_entries_primary_name_trgm',
            'primary_name',
            postgresql_using='gin',
            postgresql_ops={'primary_name': 'gin_trgm_ops'}
        ),
        Index(
            'idx_entries_other_language_codes',
            'other_language_codes',
            postgresql_using='gin'
        ),
    )

    # Relationships
    creator = relationship(
        "User", foreign_keys=[created_by], back_populates="created_entries"
    )
    updater = relationship(
        "User", foreign_keys=[updated_by], back_populates="updated_entries"
    )
    translations = relationship(
        "Translation",
        back_populates="entry",
        order_by="Translation.is_preferred.desc(), Translation.created_at.asc()"
    )
    comments = relationship("Comment", back_populates="entry")
    source_relationships = relationship(
        "EntryRelationship", foreign_keys="EntryRelationship.source_entry_id",
        back_populates="source_entry"
    )
    target_relationships = relationship(
        "EntryRelationship", foreign_keys="EntryRelationship.target_entry_id",
        back_populates="target_entry"
    )
    history = relationship("EntryHistory", back_populates="entry")


class Translation(Base):
    __tablename__ = "translations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entry_id = Column(
        UUID(as_uuid=True), ForeignKey("entries.id", ondelete="CASCADE"),
        nullable=False
    )
    language_code = Column(String(10), nullable=False)
    translated_name = Column(String(500), nullable=False)
    notes = Column(Text)
    source_id = Column(UUID(as_uuid=True), ForeignKey("sources.id"))
    is_preferred = Column(Boolean, default=False, server_default="false")
    upvotes = Column(Integer, default=0, server_default="0")
    downvotes = Column(Integer, default=0, server_default="0")
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint(
            'entry_id', 'language_code', 'translated_name',
            name='translations_entry_lang_name_unique'
        ),
        Index('idx_translations_entry_id', 'entry_id'),
        Index('idx_translations_language', 'language_code'),
        Index('idx_translations_source', 'source_id'),
        Index('idx_translations_name', 'translated_name'),
        Index('idx_translations_preferred', 'is_preferred'),
    )

    # Relationships
    entry = relationship("Entry", back_populates="translations")
    source = relationship("Source", back_populates="translations")
    creator = relationship(
        "User", foreign_keys=[created_by], back_populates="created_translations"
    )
    updater = relationship(
        "User", foreign_keys=[updated_by], back_populates="updated_translations"
    )
    votes = relationship("TranslationVote", back_populates="translation")


class TranslationVote(Base):
    __tablename__ = "translation_votes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    translation_id = Column(
        UUID(as_uuid=True), ForeignKey("translations.id", ondelete="CASCADE"),
        nullable=False
    )
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    vote_type = Column(String(10), nullable=False)  # 'up' or 'down'
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint(
            "vote_type IN ('up', 'down')",
            name="translation_votes_vote_type_check"
        ),
        UniqueConstraint(
            'translation_id', 'user_id',
            name='translation_votes_translation_user_unique'
        ),
        Index('idx_translation_votes_translation_id', 'translation_id'),
        Index('idx_translation_votes_user_id', 'user_id'),
        Index('idx_translation_votes_vote_type', 'vote_type'),
    )

    # Relationships
    translation = relationship("Translation", back_populates="votes")
    user = relationship("User", back_populates="translation_votes")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entry_id = Column(
        UUID(as_uuid=True), ForeignKey("entries.id", ondelete="CASCADE"),
        nullable=False
    )
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    parent_comment_id = Column(
        UUID(as_uuid=True), ForeignKey("comments.id", ondelete="CASCADE")
    )
    content = Column(Text, nullable=False)
    is_edited = Column(Boolean, default=False, server_default="false")
    edit_history = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index('idx_comments_entry_id', 'entry_id'),
        Index('idx_comments_user_id', 'user_id'),
        Index('idx_comments_parent', 'parent_comment_id'),
        Index('idx_comments_created_at', 'created_at'),
    )

    # Relationships
    entry = relationship("Entry", back_populates="comments")
    user = relationship("User", back_populates="comments")
    parent_comment = relationship("Comment", remote_side=[id])


class EntryRelationship(Base):
    __tablename__ = "entry_relationships"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_entry_id = Column(
        UUID(as_uuid=True), ForeignKey("entries.id", ondelete="CASCADE"),
        nullable=False
    )
    target_entry_id = Column(
        UUID(as_uuid=True), ForeignKey("entries.id", ondelete="CASCADE"),
        nullable=False
    )
    relationship_type = Column(String(50), nullable=False)
    notes = Column(Text)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint(
            "relationship_type IN ('synonym', 'antonym', 'related', 'variant', "
            "'see_also', 'broader_term', 'narrower_term', 'cross_language_equivalent')",
            name="entry_relationships_relationship_type_check"
        ),
        UniqueConstraint(
            'source_entry_id', 'target_entry_id', 'relationship_type',
            name='entry_relationships_source_target_type_unique'
        ),
        Index('idx_entry_relationships_source', 'source_entry_id'),
        Index('idx_entry_relationships_target', 'target_entry_id'),
        Index('idx_entry_relationships_type', 'relationship_type'),
    )

    # Relationships
    source_entry = relationship(
        "Entry", foreign_keys=[source_entry_id], back_populates="source_relationships"
    )
    target_entry = relationship(
        "Entry", foreign_keys=[target_entry_id], back_populates="target_relationships"
    )
    created_by_user = relationship("User", back_populates="entry_relationships")


class EntryHistory(Base):
    __tablename__ = "entry_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entry_id = Column(
        UUID(as_uuid=True), ForeignKey("entries.id", ondelete="CASCADE"),
        nullable=False
    )
    changed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    change_type = Column(String(20), nullable=False)
    old_values = Column(JSONB)
    new_values = Column(JSONB)
    change_reason = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint(
            "change_type IN ('created', 'updated', 'verified', 'archived')",
            name="entry_history_change_type_check"
        ),
    )

    # Relationships
    entry = relationship("Entry", back_populates="history")
    changed_by_user = relationship("User", back_populates="entry_history")
