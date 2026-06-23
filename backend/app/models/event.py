from sqlalchemy import CheckConstraint, Column, Date, ForeignKey, Integer, String, Table, Time, UniqueConstraint
from sqlalchemy.orm import relationship

from app.db.database import Base
from app.models.genre import genre_check_constraint


EVENT_TYPE_VALUES = [
    "concert",
    "festival",
    "dj-set",
]


def event_type_check_constraint(column_name: str) -> str:
    values = ", ".join(f"'{event_type}'" for event_type in EVENT_TYPE_VALUES)
    return f"{column_name} IN ({values})"


event_artists = Table(
    "event_artists",
    Base.metadata,
    Column("event_id", ForeignKey("events.id"), primary_key=True),
    Column("artist_id", ForeignKey("artists.id"), primary_key=True),
)


class Event(Base):
    __tablename__ = "events"

    __table_args__ = (
        CheckConstraint(
            genre_check_constraint("genre"),
            name="check_event_genre",
        ),
        CheckConstraint(
            event_type_check_constraint("event_type"),
            name="check_event_type",
        ),
        UniqueConstraint(
            "external_source",
            "external_id",
            name="uq_events_external_source_id",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)

    event_date = Column(Date, nullable=False)
    event_time = Column(Time, nullable=False)

    event_type = Column(String, nullable=False)
    genre = Column(String, nullable=False)
    state = Column(String, nullable=False)
    city = Column(String, nullable=False)

    venue_id = Column(Integer, ForeignKey("venues.id"), nullable=False)
    main_artist_id = Column(Integer, ForeignKey("artists.id"), nullable=False)

    image_url = Column(String, nullable=False)
    youtube_embed_url = Column(String, nullable=True)
    status = Column(String, nullable=False)
    external_source = Column(String, nullable=True)
    external_id = Column(String, nullable=True)

    venue = relationship(
        "Venue",
        back_populates="events",
    )

    artist = relationship(
        "Artist",
        back_populates="main_events",
        foreign_keys=[main_artist_id],
    )

    lineup = relationship(
        "Artist",
        secondary=event_artists,
    )

    ticket_links = relationship(
        "TicketLink",
        back_populates="event",
        cascade="all, delete-orphan",
    )
