from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.models.sync_log import SyncLog
from app.services.ticketmaster_sync import SyncResult


def utc_now() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def create_sync_log(
    db: Session,
    *,
    source: str,
    sync_type: str,
    state_code: str | None = None,
    city: str | None = None,
    keyword: str | None = None,
) -> SyncLog:
    sync_log = SyncLog(
        source=source,
        sync_type=sync_type,
        status="running",
        state_code=state_code,
        city=city,
        keyword=keyword,
        started_at=utc_now(),
    )
    db.add(sync_log)
    db.commit()
    db.refresh(sync_log)
    return sync_log


def complete_sync_log(db: Session, sync_log: SyncLog, result: SyncResult) -> SyncLog:
    sync_log.status = "success"
    sync_log.finished_at = utc_now()
    sync_log.created_events = result.created_events
    sync_log.updated_events = result.updated_events
    sync_log.created_artists = result.created_artists
    sync_log.matched_artists = result.matched_artists
    sync_log.created_venues = result.created_venues
    sync_log.matched_venues = result.matched_venues
    sync_log.skipped_events = result.skipped_events
    sync_log.fetched_events = result.fetched_events
    sync_log.pages_fetched = result.pages_fetched
    sync_log.reached_page_limit = result.reached_ticketmaster_page_limit
    sync_log.error_message = None
    db.commit()
    db.refresh(sync_log)
    return sync_log


def fail_sync_log(db: Session, sync_log: SyncLog, error: Exception) -> SyncLog:
    sync_log.status = "failed"
    sync_log.finished_at = utc_now()
    sync_log.error_message = str(error)
    db.commit()
    db.refresh(sync_log)
    return sync_log


def serialize_sync_log(sync_log: SyncLog) -> dict:
    return {
        "id": sync_log.id,
        "source": sync_log.source,
        "sync_type": sync_log.sync_type,
        "status": sync_log.status,
        "state_code": sync_log.state_code,
        "city": sync_log.city,
        "keyword": sync_log.keyword,
        "started_at": sync_log.started_at.isoformat(),
        "finished_at": (
            sync_log.finished_at.isoformat()
            if sync_log.finished_at
            else None
        ),
        "created_events": sync_log.created_events,
        "updated_events": sync_log.updated_events,
        "created_artists": sync_log.created_artists,
        "matched_artists": sync_log.matched_artists,
        "created_venues": sync_log.created_venues,
        "matched_venues": sync_log.matched_venues,
        "skipped_events": sync_log.skipped_events,
        "fetched_events": sync_log.fetched_events,
        "pages_fetched": sync_log.pages_fetched,
        "reached_page_limit": sync_log.reached_page_limit,
        "error_message": sync_log.error_message,
    }
