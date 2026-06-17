from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from rapidfuzz import fuzz
from sqlalchemy.orm import Session, joinedload, selectinload

from app.db.database import get_db
from app.models.artist import Artist
from app.models.event import Event
from app.models.venue import Venue


app = FastAPI(title="Aussie Gigs API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def is_fuzzy_match(query: str, text: str, threshold: int = 70) -> bool:
    if not query or not text:
        return False

    score = fuzz.partial_ratio(query.lower(), text.lower())
    return score >= threshold


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
        normalized_query = q.lower()

        events = [
            event for event in events
            if is_fuzzy_match(normalized_query, event["title"])
            or is_fuzzy_match(normalized_query, event["artist"]["name"])
            or is_fuzzy_match(normalized_query, event["venue"]["name"])
            or is_fuzzy_match(normalized_query, event["city"])
            or is_fuzzy_match(normalized_query, event["state"])
            or is_fuzzy_match(normalized_query, event["genre"])
            or any(
                is_fuzzy_match(normalized_query, artist["name"])
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
