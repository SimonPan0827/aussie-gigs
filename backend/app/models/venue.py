from sqlalchemy import Column, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.db.database import Base


class Venue(Base):
    __tablename__ = "venues"
    __table_args__ = (
        UniqueConstraint(
            "external_source",
            "external_id",
            name="uq_venues_external_source_id",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    state = Column(String, nullable=False)
    city = Column(String, nullable=False)
    address = Column(String, nullable=False)
    image_url = Column(String, nullable=True)
    external_source = Column(String, nullable=True)
    external_id = Column(String, nullable=True)

    events = relationship(
        "Event",
        back_populates="venue",
    )
