import re
import unicodedata
from dataclasses import dataclass
from datetime import date, time, timedelta

from sqlalchemy.orm import Session

from app.models.artist import Artist
from app.models.event import Event
from app.models.external_identity import ExternalIdentity
from app.models.genre import GENRE_VALUES
from app.models.ticket_link import TicketLink
from app.models.venue import Venue
from app.services.dedup import find_artist_match, find_event_match, find_venue_match
from app.services.ticketmaster import search_events


SOURCE = "ticketmaster"
DEFAULT_IMAGE_URL = "https://images.unsplash.com/photo-1501386761578-eac5c94b800a"
DEFAULT_TIME = time(19, 0)
IGNORED_IMAGE_URLS = {
    "https://s1.ticketm.net/dam/c/df8/81eadad8-4449-412e-a2b1-3d8bbb78edf8_106181_TABLET_LANDSCAPE_LARGE_16_9.jpg",
}

STATE_NAMES = {
    "Australian Capital Territory": "ACT",
    "New South Wales": "NSW",
    "Northern Territory": "NT",
    "Queensland": "QLD",
    "South Australia": "SA",
    "Tasmania": "TAS",
    "Victoria": "VIC",
    "Western Australia": "WA",
}

GENRE_ALIASES = {
    "alternative": "alternative",
    "electronic": "electronic",
    "dance/electronic": "electronic",
    "dance": "dance",
    "hip-hop": "hip-hop",
    "hip hop": "hip-hop",
    "indie": "indie",
    "jazz": "jazz",
    "pop": "pop",
    "rap": "hip-hop",
    "rock": "rock",
}


@dataclass
class SyncResult:
    created_events: int = 0
    updated_events: int = 0
    created_artists: int = 0
    matched_artists: int = 0
    created_venues: int = 0
    matched_venues: int = 0
    skipped_events: int = 0
    fetched_events: int = 0
    pages_fetched: int = 0
    reached_ticketmaster_page_limit: bool = False


def add_sync_results(total: SyncResult, item: SyncResult) -> None:
    total.created_events += item.created_events
    total.updated_events += item.updated_events
    total.created_artists += item.created_artists
    total.matched_artists += item.matched_artists
    total.created_venues += item.created_venues
    total.matched_venues += item.matched_venues
    total.skipped_events += item.skipped_events
    total.fetched_events += item.fetched_events
    total.pages_fetched += item.pages_fetched
    total.reached_ticketmaster_page_limit = (
        total.reached_ticketmaster_page_limit
        or item.reached_ticketmaster_page_limit
    )


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    normalized = normalized.encode("ascii", "ignore").decode("ascii")
    normalized = re.sub(r"[^a-zA-Z0-9]+", "-", normalized.lower())
    return normalized.strip("-") or "item"


def unique_slug(db: Session, model, base: str, current_id: int | None = None) -> str:
    slug = slugify(base)
    candidate = slug
    counter = 2

    while True:
        query = db.query(model).filter(model.slug == candidate)

        if current_id is not None:
            query = query.filter(model.id != current_id)

        if not query.first():
            return candidate

        candidate = f"{slug}-{counter}"
        counter += 1


def get_external_identity(
    db: Session,
    *,
    entity_type: str,
    external_id: str | None,
) -> ExternalIdentity | None:
    if not external_id:
        return None

    return db.query(ExternalIdentity).filter(
        ExternalIdentity.entity_type == entity_type,
        ExternalIdentity.external_source == SOURCE,
        ExternalIdentity.external_id == external_id,
    ).first()


def attach_external_identity(
    db: Session,
    *,
    entity_type: str,
    entity_id: int,
    external_id: str | None,
) -> None:
    if not external_id:
        return

    identity = get_external_identity(
        db,
        entity_type=entity_type,
        external_id=external_id,
    )

    if identity:
        identity.entity_id = entity_id
        return

    db.add(
        ExternalIdentity(
            entity_type=entity_type,
            entity_id=entity_id,
            external_source=SOURCE,
            external_id=external_id,
        )
    )


def is_ignored_image_url(url: str | None) -> bool:
    return not url or url in IGNORED_IMAGE_URLS


def choose_image(images: list[dict] | None) -> str | None:
    if not images:
        return None

    real_images = [
        image
        for image in images
        if not image.get("fallback", False)
        and not is_ignored_image_url(image.get("url"))
    ]

    if not real_images:
        return None

    preferred = sorted(
        real_images,
        key=lambda image: (
            image.get("ratio") == "16_9",
            image.get("width", 0) * image.get("height", 0),
        ),
        reverse=True,
    )

    return preferred[0].get("url")


def pick_genre(item: dict) -> str:
    classifications = item.get("classifications") or []

    for classification in classifications:
        candidates = [
            (classification.get("genre") or {}).get("name"),
            (classification.get("subGenre") or {}).get("name"),
            (classification.get("segment") or {}).get("name"),
        ]

        for candidate in candidates:
            normalized = (candidate or "").lower()

            if normalized in GENRE_ALIASES:
                return GENRE_ALIASES[normalized]

            for alias, genre in GENRE_ALIASES.items():
                if alias in normalized:
                    return genre

    return "pop" if "pop" in GENRE_VALUES else GENRE_VALUES[0]


def pick_event_type(item: dict) -> str:
    if pick_genre(item) in {"dance", "electronic"}:
        return "dj-set"

    name = (item.get("name") or "").lower()
    classifications = item.get("classifications") or []
    type_names = [
        ((classification.get("type") or {}).get("name") or "").lower()
        for classification in classifications
    ]

    if "festival" in name or any("festival" in type_name for type_name in type_names):
        return "festival"

    if "dj" in name:
        return "dj-set"

    return "concert"


def event_status(item: dict) -> str:
    status = ((item.get("dates") or {}).get("status") or {}).get("code")

    if status in {"cancelled", "canceled", "postponed", "rescheduled"}:
        return status

    return "upcoming"


def parse_event_date(item: dict) -> date | None:
    local_date = ((item.get("dates") or {}).get("start") or {}).get("localDate")

    if not local_date:
        return None

    return date.fromisoformat(local_date)


def parse_event_time(item: dict) -> time:
    local_time = ((item.get("dates") or {}).get("start") or {}).get("localTime")

    if not local_time:
        return DEFAULT_TIME

    return time.fromisoformat(local_time)


def venue_state(venue_data: dict) -> str:
    state = venue_data.get("state") or {}
    return state.get("stateCode") or STATE_NAMES.get(state.get("name")) or ""


def venue_address(venue_data: dict) -> str:
    address = venue_data.get("address") or {}
    line = address.get("line1")
    city = (venue_data.get("city") or {}).get("name")
    state = venue_state(venue_data)
    parts = [part for part in [line, city, state] if part]
    return ", ".join(parts) or "Address TBA"


def ensure_artist(db: Session, attraction: dict, fallback_genre: str, result: SyncResult) -> Artist:
    external_id = attraction.get("id")
    identity = get_external_identity(db, entity_type="artist", external_id=external_id)

    if identity:
        artist = db.query(Artist).filter(Artist.id == identity.entity_id).first()

        if artist:
            result.matched_artists += 1
            return artist

    name = attraction.get("name") or "Unknown Artist"
    slug = slugify(name)
    image_url = choose_image(attraction.get("images"))
    genre = pick_genre(attraction) if attraction.get("classifications") else fallback_genre
    match = find_artist_match(
        db,
        name=name,
        slug=slug,
        external_source=SOURCE,
        external_id=external_id,
    )

    if match:
        artist = match.record
        result.matched_artists += 1

        if is_ignored_image_url(artist.image_url) and image_url:
            artist.image_url = image_url
        elif artist.image_url in IGNORED_IMAGE_URLS and not image_url:
            artist.image_url = None

        if not artist.external_source and external_id:
            artist.external_source = SOURCE
            artist.external_id = external_id
    else:
        artist = Artist(
            name=name,
            slug=unique_slug(db, Artist, name),
            image_url=image_url,
            genre=genre,
            external_source=SOURCE if external_id else None,
            external_id=external_id,
        )
        db.add(artist)
        db.flush()
        result.created_artists += 1

    attach_external_identity(
        db,
        entity_type="artist",
        entity_id=artist.id,
        external_id=external_id,
    )

    return artist


def ensure_venue(db: Session, venue_data: dict, result: SyncResult) -> Venue:
    external_id = venue_data.get("id")
    identity = get_external_identity(db, entity_type="venue", external_id=external_id)

    if identity:
        venue = db.query(Venue).filter(Venue.id == identity.entity_id).first()

        if venue:
            result.matched_venues += 1
            return venue

    name = venue_data.get("name") or "Venue TBA"
    city = (venue_data.get("city") or {}).get("name") or "TBA"
    state = venue_state(venue_data) or "VIC"
    image_url = choose_image(venue_data.get("images"))
    slug = slugify(f"{name}-{city}")
    match = find_venue_match(
        db,
        name=name,
        state=state,
        city=city,
        slug=slug,
        external_source=SOURCE,
        external_id=external_id,
    )

    if match:
        venue = match.record
        result.matched_venues += 1

        if is_ignored_image_url(venue.image_url) and image_url:
            venue.image_url = image_url
        elif venue.image_url in IGNORED_IMAGE_URLS and not image_url:
            venue.image_url = None

        if not venue.external_source and external_id:
            venue.external_source = SOURCE
            venue.external_id = external_id
    else:
        venue = Venue(
            name=name,
            slug=unique_slug(db, Venue, f"{name}-{city}"),
            state=state,
            city=city,
            address=venue_address(venue_data),
            image_url=image_url,
            external_source=SOURCE if external_id else None,
            external_id=external_id,
        )
        db.add(venue)
        db.flush()
        result.created_venues += 1

    attach_external_identity(
        db,
        entity_type="venue",
        entity_id=venue.id,
        external_id=external_id,
    )

    return venue


def ensure_ticketmaster_link(event: Event, url: str | None) -> None:
    if not url:
        return

    for ticket_link in event.ticket_links:
        if ticket_link.provider.lower() == SOURCE and ticket_link.url == url:
            return

    event.ticket_links.append(
        TicketLink(
            provider="Ticketmaster",
            url=url,
            is_primary=not event.ticket_links,
        )
    )


def unique_artists(artists: list[Artist]) -> list[Artist]:
    unique = []
    seen_ids = set()
    seen_objects = set()

    for artist in artists:
        if artist.id is not None:
            if artist.id in seen_ids:
                continue

            seen_ids.add(artist.id)
        else:
            object_id = id(artist)

            if object_id in seen_objects:
                continue

            seen_objects.add(object_id)

        unique.append(artist)

    return unique


def sync_ticketmaster_event(db: Session, item: dict, result: SyncResult) -> None:
    event_date = parse_event_date(item)

    if not event_date:
        result.skipped_events += 1
        return

    embedded = item.get("_embedded") or {}
    venue_data = (embedded.get("venues") or [{}])[0]
    attractions = embedded.get("attractions") or []

    if not venue_data or not attractions:
        result.skipped_events += 1
        return

    genre = pick_genre(item)
    venue = ensure_venue(db, venue_data, result)
    artists = [
        ensure_artist(db, attraction, genre, result)
        for attraction in attractions
    ]
    artists = unique_artists(artists)
    main_artist = artists[0]
    external_id = item.get("id")
    identity = get_external_identity(db, entity_type="event", external_id=external_id)

    if identity:
        event = db.query(Event).filter(Event.id == identity.entity_id).first()

        if event:
            update_event(event, item, venue, main_artist, artists, genre)
            result.updated_events += 1
            return

    title = item.get("name") or f"{main_artist.name} at {venue.name}"
    match = find_event_match(
        db,
        title=title,
        event_date=event_date,
        state=venue.state,
        city=venue.city,
        venue_name=venue.name,
        artist_name=main_artist.name,
        slug=slugify(f"{title}-{venue.city}"),
        external_source=SOURCE,
        external_id=external_id,
    )

    if match:
        event = match.record
        update_event(event, item, venue, main_artist, artists, genre)

        if not event.external_source and external_id:
            event.external_source = SOURCE
            event.external_id = external_id

        result.updated_events += 1
    else:
        image_url = choose_image(item.get("images"))
        event = Event(
            title=title,
            slug=unique_slug(db, Event, f"{title}-{venue.city}"),
            event_date=event_date,
            event_time=parse_event_time(item),
            event_type=pick_event_type(item),
            genre=genre,
            state=venue.state,
            city=venue.city,
            venue=venue,
            artist=main_artist,
            image_url=image_url or main_artist.image_url or DEFAULT_IMAGE_URL,
            youtube_embed_url=None,
            status=event_status(item),
            external_source=SOURCE if external_id else None,
            external_id=external_id,
        )
        event.lineup = unique_artists(artists)
        db.add(event)
        db.flush()
        result.created_events += 1

    ensure_ticketmaster_link(event, item.get("url"))
    attach_external_identity(
        db,
        entity_type="event",
        entity_id=event.id,
        external_id=external_id,
    )


def update_event(
    event: Event,
    item: dict,
    venue: Venue,
    main_artist: Artist,
    artists: list[Artist],
    genre: str,
) -> None:
    event.venue = venue
    event.artist = main_artist
    event.event_date = parse_event_date(item) or event.event_date
    event.event_time = parse_event_time(item)
    event.event_type = pick_event_type(item)
    event.genre = genre
    event.state = venue.state
    event.city = venue.city
    event.status = event_status(item)

    image_url = choose_image(item.get("images"))

    if is_ignored_image_url(event.image_url):
        event.image_url = image_url or main_artist.image_url or DEFAULT_IMAGE_URL

    existing_artist_ids = {
        artist.id
        for artist in event.lineup
        if artist.id is not None
    }

    for artist in unique_artists(artists):
        if artist.id is not None and artist.id in existing_artist_ids:
            continue

        if artist not in event.lineup:
            event.lineup.append(artist)

        if artist.id is not None:
            existing_artist_ids.add(artist.id)

    ensure_ticketmaster_link(event, item.get("url"))


def sync_ticketmaster_events(
    db: Session,
    *,
    city: str | None = None,
    state_code: str | None = None,
    keyword: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    size: int = 20,
    page: int = 0,
) -> SyncResult:
    payload = search_events(
        city=city,
        state_code=state_code,
        keyword=keyword,
        start_date=start_date,
        end_date=end_date,
        size=size,
        page=page,
    )
    events = (payload.get("_embedded") or {}).get("events") or []
    result = SyncResult()
    result.fetched_events = len(events)
    result.pages_fetched = 1 if events else 0

    for item in events:
        sync_ticketmaster_event(db, item, result)

    db.commit()
    return result


def sync_ticketmaster_date_range(
    db: Session,
    *,
    city: str | None = None,
    state_code: str | None = None,
    keyword: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    size: int = 100,
) -> SyncResult:
    size = max(50, min(size, 100))
    page = 0
    result = SyncResult()

    while True:
        payload = search_events(
            city=city,
            state_code=state_code,
            keyword=keyword,
            start_date=start_date,
            end_date=end_date,
            size=size,
            page=page,
        )
        events = (payload.get("_embedded") or {}).get("events") or []

        if not events:
            break

        result.fetched_events += len(events)
        result.pages_fetched += 1

        for item in events:
            sync_ticketmaster_event(db, item, result)

        db.commit()

        page_info = payload.get("page") or {}
        total_pages = page_info.get("totalPages")
        has_more_pages = total_pages is None or page + 1 < total_pages

        if not has_more_pages or len(events) < size:
            break

        if size * (page + 1) >= 1000:
            result.reached_ticketmaster_page_limit = True
            break

        page += 1

    return result


def sync_ticketmaster_catalog(
    db: Session,
    *,
    city: str | None = None,
    state_code: str | None = None,
    keyword: str | None = None,
    size: int = 100,
) -> dict:
    today = date.today()
    past_start = today - timedelta(days=365)
    past_end = today - timedelta(days=1)

    past = sync_ticketmaster_date_range(
        db,
        city=city,
        state_code=state_code,
        keyword=keyword,
        start_date=past_start,
        end_date=past_end,
        size=size,
    )
    upcoming = sync_ticketmaster_date_range(
        db,
        city=city,
        state_code=state_code,
        keyword=keyword,
        start_date=today,
        end_date=None,
        size=size,
    )
    total = SyncResult()
    add_sync_results(total, past)
    add_sync_results(total, upcoming)

    return {
        "past_window": {
            "start_date": past_start.isoformat(),
            "end_date": past_end.isoformat(),
            "result": past,
        },
        "upcoming_window": {
            "start_date": today.isoformat(),
            "end_date": None,
            "result": upcoming,
        },
        "total": total,
    }
