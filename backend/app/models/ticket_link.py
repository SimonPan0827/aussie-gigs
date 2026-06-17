from sqlalchemy import Boolean, Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db.database import Base


class TicketLink(Base):
    __tablename__ = "ticket_links"

    id = Column(Integer, primary_key=True, index=True)

    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)

    provider = Column(String, nullable=False)
    url = Column(String, nullable=False)
    is_primary = Column(Boolean, default=False, nullable=False)

    event = relationship(
        "Event",
        back_populates="ticket_links",
    )