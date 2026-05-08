"""add phone number to users

Revision ID: 824ea5b725d0
Revises: 454be984e4ac
Create Date: 2026-05-08 17:51:17.200834
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "824ea5b725d0"
down_revision: Union[str, Sequence[str], None] = "454be984e4ac"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("phone_number", sa.String(), nullable=True),
    )

    op.execute(
        "UPDATE users SET phone_number = 'TEMP_PHONE_' || id WHERE phone_number IS NULL"
    )

    op.alter_column(
        "users",
        "phone_number",
        nullable=False,
    )

    op.create_unique_constraint(
        "uq_users_phone_number",
        "users",
        ["phone_number"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_users_phone_number",
        "users",
        type_="unique",
    )

    op.drop_column("users", "phone_number")