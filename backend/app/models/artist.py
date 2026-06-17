from sqlalchemy import CheckConstraint, Column, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.db.database import Base
from app.models.genre import genre_check_constraint


class Artist(Base):
    __tablename__ = "artists"

    __table_args__ = (
        CheckConstraint(
            genre_check_constraint("genre"),
            name="check_artist_genre",
        ),
        UniqueConstraint(
            "external_source",
            "external_id",
            name="uq_artists_external_source_id",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    image_url = Column(String, nullable=True)
    genre = Column(String, nullable=False)
    external_source = Column(String, nullable=True)
    external_id = Column(String, nullable=True)

    main_events = relationship(
        "Event",
        back_populates="artist",
        foreign_keys="Event.main_artist_id",
    )
