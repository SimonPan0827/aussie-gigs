from datetime import date

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from rapidfuzz import fuzz
from sqlalchemy.orm import Session, joinedload, selectinload

from app.db.database import get_db
from app.models.artist import Artist
from app.models.event import Event
from app.models.sync_log import SyncLog
from app.models.venue import Venue
from app.services.sync_logs import (
    complete_sync_log,
    create_sync_log,
    fail_sync_log,
    serialize_sync_log,
)
from app.services.ticketmaster import TicketmasterError, search_events
from app.services.ticketmaster_sync import (
    SyncResult,
    sync_ticketmaster_catalog,
    sync_ticketmaster_events,
    sync_ticketmaster_upcoming,
)


app = FastAPI(title="Aussie Gigs API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def normalize_search_text(text: str) -> str:
    return " ".join(text.lower().split())


def is_search_match(query: str, text: str) -> bool:
    if not query or not text:
        return False

    normalized_query = normalize_search_text(query)
    normalized_text = normalize_search_text(text)

    if not normalized_query or not normalized_text:
        return False

    if normalized_query in normalized_text:
        return True

    if len(normalized_query) < 4:
        return False

    score = fuzz.token_set_ratio(normalized_query, normalized_text)
    return score >= 88


def serialize_artist(artist: Artist):
    return {
        "id": artist.id,
        "name": artist.name,
        "slug": artist.slug,
        "image_url": artist.image_url,
        "genre": artist.genre,
    }


def serialize_venue(venue: Venue):
    return {
        "id": venue.id,
        "name": venue.name,
        "slug": venue.slug,
        "state": venue.state,
        "city": venue.city,
        "address": venue.address,
        "image_url": venue.image_url,
    }


def serialize_ticket_link(ticket_link):
    return {
        "provider": ticket_link.provider,
        "url": ticket_link.url,
        "is_primary": ticket_link.is_primary,
    }


def serialize_event(event: Event):
    return {
        "id": event.id,
        "title": event.title,
        "slug": event.slug,
        "event_date": event.event_date.isoformat(),
        "event_time": event.event_time.strftime("%H:%M"),
        "event_type": event.event_type,
        "genre": event.genre,
        "state": event.state,
        "city": event.city,
        "venue": serialize_venue(event.venue),
        "artist": serialize_artist(event.artist),
        "lineup": [serialize_artist(artist) for artist in event.lineup],
        "image_url": event.image_url,
        "youtube_embed_url": event.youtube_embed_url,
        "status": event.status,
        "ticket_links": [
            serialize_ticket_link(ticket_link)
            for ticket_link in event.ticket_links
        ],
    }


def event_query(db: Session):
    return db.query(Event).options(
        joinedload(Event.venue),
        joinedload(Event.artist),
        selectinload(Event.lineup),
        selectinload(Event.ticket_links),
    )

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Aussie Gigs API is running"}


def ticketmaster_preview_event(item: dict):
    embedded = item.get("_embedded") or {}
    venues = embedded.get("venues") or []
    attractions = embedded.get("attractions") or []
    start = (item.get("dates") or {}).get("start") or {}

    return {
        "external_id": item.get("id"),
        "title": item.get("name"),
        "date": start.get("localDate"),
        "time": start.get("localTime"),
        "venue": venues[0].get("name") if venues else None,
        "city": ((venues[0].get("city") or {}).get("name") if venues else None),
        "state": (
            ((venues[0].get("state") or {}).get("stateCode") if venues else None)
        ),
        "artists": [
            attraction.get("name")
            for attraction in attractions
            if attraction.get("name")
        ],
        "url": item.get("url"),
    }


def serialize_sync_result(result: SyncResult):
    return {
        "created_events": result.created_events,
        "updated_events": result.updated_events,
        "created_artists": result.created_artists,
        "matched_artists": result.matched_artists,
        "created_venues": result.created_venues,
        "matched_venues": result.matched_venues,
        "skipped_events": result.skipped_events,
        "fetched_events": result.fetched_events,
        "pages_fetched": result.pages_fetched,
        "reached_ticketmaster_page_limit": result.reached_ticketmaster_page_limit,
    }


@app.get("/integrations/ticketmaster/events")
def preview_ticketmaster_events(
    city: str | None = None,
    state_code: str | None = None,
    keyword: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    size: int = Query(default=20, ge=1, le=100),
    page: int = Query(default=0, ge=0),
):
    try:
        payload = search_events(
            city=city,
            state_code=state_code,
            keyword=keyword,
            start_date=start_date,
            end_date=end_date,
            size=size,
            page=page,
        )
    except TicketmasterError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    events = (payload.get("_embedded") or {}).get("events") or []

    return {
        "count": len(events),
        "page": payload.get("page"),
        "events": [ticketmaster_preview_event(item) for item in events],
    }


@app.post("/integrations/ticketmaster/sync")
def sync_ticketmaster(
    city: str | None = None,
    state_code: str | None = None,
    keyword: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    size: int = Query(default=20, ge=1, le=100),
    page: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    sync_log = create_sync_log(
        db,
        source="ticketmaster",
        sync_type="manual-page",
        state_code=state_code,
        city=city,
        keyword=keyword,
    )

    try:
        result = sync_ticketmaster_events(
            db,
            city=city,
            state_code=state_code,
            keyword=keyword,
            start_date=start_date,
            end_date=end_date,
            size=size,
            page=page,
        )
    except TicketmasterError as exc:
        fail_sync_log(db, sync_log, exc)
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    complete_sync_log(db, sync_log, result)
    return serialize_sync_result(result)


@app.post("/integrations/ticketmaster/sync-catalog")
def sync_ticketmaster_default_catalog(
    city: str | None = None,
    state_code: str | None = None,
    keyword: str | None = None,
    size: int = Query(default=100, ge=50, le=100),
    db: Session = Depends(get_db),
):
    sync_log = create_sync_log(
        db,
        source="ticketmaster",
        sync_type="manual-catalog",
        state_code=state_code,
        city=city,
        keyword=keyword,
    )

    try:
        result = sync_ticketmaster_catalog(
            db,
            city=city,
            state_code=state_code,
            keyword=keyword,
            size=size,
        )
    except TicketmasterError as exc:
        fail_sync_log(db, sync_log, exc)
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    complete_sync_log(db, sync_log, result["total"])
    return {
        "past_window": {
            "start_date": result["past_window"]["start_date"],
            "end_date": result["past_window"]["end_date"],
            "result": serialize_sync_result(result["past_window"]["result"]),
        },
        "upcoming_window": {
            "start_date": result["upcoming_window"]["start_date"],
            "end_date": result["upcoming_window"]["end_date"],
            "result": serialize_sync_result(result["upcoming_window"]["result"]),
        },
        "total": serialize_sync_result(result["total"]),
    }


@app.post("/integrations/ticketmaster/sync-upcoming")
def sync_ticketmaster_upcoming_events(
    city: str | None = None,
    state_code: str | None = None,
    keyword: str | None = None,
    size: int = Query(default=100, ge=50, le=100),
    db: Session = Depends(get_db),
):
    sync_log = create_sync_log(
        db,
        source="ticketmaster",
        sync_type="manual-upcoming",
        state_code=state_code,
        city=city,
        keyword=keyword,
    )

    try:
        result = sync_ticketmaster_upcoming(
            db,
            city=city,
            state_code=state_code,
            keyword=keyword,
            size=size,
        )
    except TicketmasterError as exc:
        fail_sync_log(db, sync_log, exc)
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    complete_sync_log(db, sync_log, result)
    return serialize_sync_result(result)


@app.get("/integrations/sync-logs")
def get_sync_logs(
    source: str | None = None,
    status: str | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(SyncLog)

    if source:
        query = query.filter(SyncLog.source == source)

    if status:
        query = query.filter(SyncLog.status == status)

    sync_logs = query.order_by(SyncLog.started_at.desc()).limit(limit).all()
    return [serialize_sync_log(sync_log) for sync_log in sync_logs]

@app.get("/events")
def get_events(
    q: str | None = None,
    state: str | None = None,
    city: str | None = None,
    event_type: str | None = None,
    genre: list[str] | None = Query(default=None),
    start_date: str | None = None,
    end_date: str | None = None,
    db: Session = Depends(get_db),
):
    query = event_query(db)

    if state:
        query = query.filter(Event.state.ilike(state))

    if city:
        query = query.filter(Event.city.ilike(city))

    if event_type:
        query = query.filter(Event.event_type.ilike(event_type))

    if genre:
        selected_genres = [item.lower() for item in genre]
        query = query.filter(Event.genre.in_(selected_genres))

    if start_date:
        query = query.filter(Event.event_date >= start_date)

    if end_date:
        query = query.filter(Event.event_date <= end_date)

    events = [
        serialize_event(event)
        for event in query.order_by(Event.event_date, Event.event_time).all()
    ]

    if q:
        normalized_query = normalize_search_text(q)

        events = [
            event for event in events
            if is_search_match(normalized_query, event["title"])
            or is_search_match(normalized_query, event["artist"]["name"])
            or is_search_match(normalized_query, event["venue"]["name"])
            or is_search_match(normalized_query, event["city"])
            or any(
                is_search_match(normalized_query, artist["name"])
                for artist in event["lineup"]
            )
        ]

    return events

@app.get("/events/{slug}")
def get_event_by_slug(slug: str, db: Session = Depends(get_db)):
    event = event_query(db).filter(Event.slug == slug).first()

    if event:
        return serialize_event(event)

    raise HTTPException(status_code=404, detail="Event not found")

@app.get("/artists")
def get_artists(db: Session = Depends(get_db)):
    artists = db.query(Artist).order_by(Artist.name).all()
    return [serialize_artist(artist) for artist in artists]


@app.get("/artists/{slug}")
def get_artist_by_slug(slug: str, db: Session = Depends(get_db)):
    artist = db.query(Artist).filter(Artist.slug == slug).first()

    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")

    events = event_query(db).filter(
        (Event.main_artist_id == artist.id)
        | (Event.lineup.any(Artist.id == artist.id))
    ).order_by(Event.event_date, Event.event_time).all()

    return {
        **serialize_artist(artist),
        "events": [serialize_event(event) for event in events],
    }

@app.get("/venues")
def get_venues(db: Session = Depends(get_db)):
    venues = db.query(Venue).order_by(Venue.name).all()
    return [serialize_venue(venue) for venue in venues]


@app.get("/venues/{slug}")
def get_venue_by_slug(slug: str, db: Session = Depends(get_db)):
    venue = db.query(Venue).filter(Venue.slug == slug).first()

    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")

    events = event_query(db).filter(
        Event.venue_id == venue.id
    ).order_by(Event.event_date, Event.event_time).all()

    return {
        **serialize_venue(venue),
        "events": [serialize_event(event) for event in events],
    }
