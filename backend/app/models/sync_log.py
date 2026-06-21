from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text

from app.db.database import Base


class SyncLog(Base):
    __tablename__ = "sync_logs"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String, nullable=False)
    sync_type = Column(String, nullable=False)
    status = Column(String, nullable=False)
    state_code = Column(String, nullable=True)
    city = Column(String, nullable=True)
    keyword = Column(String, nullable=True)
    started_at = Column(DateTime, nullable=False)
    finished_at = Column(DateTime, nullable=True)
    created_events = Column(Integer, default=0, nullable=False)
    updated_events = Column(Integer, default=0, nullable=False)
    created_artists = Column(Integer, default=0, nullable=False)
    matched_artists = Column(Integer, default=0, nullable=False)
    created_venues = Column(Integer, default=0, nullable=False)
    matched_venues = Column(Integer, default=0, nullable=False)
    skipped_events = Column(Integer, default=0, nullable=False)
    fetched_events = Column(Integer, default=0, nullable=False)
    pages_fetched = Column(Integer, default=0, nullable=False)
    reached_page_limit = Column(Boolean, default=False, nullable=False)
    error_message = Column(Text, nullable=True)
