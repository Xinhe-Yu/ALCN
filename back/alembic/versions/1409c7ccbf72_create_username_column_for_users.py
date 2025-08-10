"""create username column for users

Revision ID: 1409c7ccbf72
Revises: 7aa0b30f5dc6
Create Date: 2025-08-10 22:52:00.648801

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1409c7ccbf72'
down_revision: Union[str, Sequence[str], None] = '7aa0b30f5dc6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('username', sa.String(length=100), nullable=True))
    pass


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'username')
    pass
