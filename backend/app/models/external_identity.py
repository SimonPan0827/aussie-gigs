from sqlalchemy import Column, Integer, String, UniqueConstraint

from app.db.database import Base


class ExternalIdentity(Base):
    __tablename__ = "external_identities"

    __table_args__ = (
        UniqueConstraint(
            "entity_type",
            "external_source",
            "external_id",
            name="uq_external_identities_source_id",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String, nullable=False)
    entity_id = Column(Integer, nullable=False)
    external_source = Column(String, nullable=False)
    external_id = Column(String, nullable=False)
