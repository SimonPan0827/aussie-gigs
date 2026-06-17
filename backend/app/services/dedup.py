import re
import unicodedata
from dataclasses import dataclass
from datetime import date

from rapidfuzz import fuzz
from sqlalchemy.orm import Session

from app.models.artist import Artist
from app.models.event import Event
from app.models.venue import Venue


STOP_WORDS = {
    "a",
    "an",
    "and",
    "at",
    "by",
    "in",
    "live",
    "presents",
    "show",
    "the",
    "tour",
    "with",
}


@dataclass(frozen=True)
class DedupMatch:
    record: object
    confidence: int
    reason: str


def normalize_text(value: str | None) -> str:
    if not value:
        return ""

    normalized = unicodedata.normalize("NFKD", value)
    normalized = normalized.encode("ascii", "ignore").decode("ascii")
    normalized = normalized.lower()
    normalized = re.sub(r"[^a-z0-9]+", " ", normalized)
    words = [
        word
        for word in normalized.split()
        if word and word not in STOP_WORDS
    ]

    return " ".join(words)


def text_score(left: str | None, right: str | None) -> int:
    return int(
        fuzz.token_set_ratio(
            normalize_text(left),
            normalize_text(right),
        )
    )


def find_artist_match(
    db: Session,
    *,
    name: str,
    slug: str | None = None,
    external_source: str | None = None,
    external_id: str | None = None,
    fuzzy_threshold: int = 92,
) -> DedupMatch | None:
    if external_source and external_id:
        artist = db.query(Artist).filter(
            Artist.external_source == external_source,
            Artist.external_id == external_id,
        ).first()

        if artist:
            return DedupMatch(artist, 100, "artist external id")

    if slug:
        artist = db.query(Artist).filter(Artist.slug == slug).first()

        if artist:
            return DedupMatch(artist, 98, "artist slug")

    candidates = db.query(Artist).all()
    best_match = None
    best_score = 0

    for artist in candidates:
        score = text_score(name, artist.name)

        if score > best_score:
            best_match = artist
            best_score = score

    if best_match and best_score >= fuzzy_threshold:
        return DedupMatch(best_match, best_score, "artist fuzzy name")

    return None


def find_venue_match(
    db: Session,
    *,
    name: str,
    state: str,
    city: str,
    slug: str | None = None,
    external_source: str | None = None,
    external_id: str | None = None,
    fuzzy_threshold: int = 90,
) -> DedupMatch | None:
    if external_source and external_id:
        venue = db.query(Venue).filter(
            Venue.external_source == external_source,
            Venue.external_id == external_id,
        ).first()

        if venue:
            return DedupMatch(venue, 100, "venue external id")

    if slug:
        venue = db.query(Venue).filter(Venue.slug == slug).first()

        if venue:
            return DedupMatch(venue, 98, "venue slug")

    candidates = db.query(Venue).filter(
        Venue.state.ilike(state),
        Venue.city.ilike(city),
    ).all()
    best_match = None
    best_score = 0

    for venue in candidates:
        score = text_score(name, venue.name)

        if score > best_score:
            best_match = venue
            best_score = score

    if best_match and best_score >= fuzzy_threshold:
        return DedupMatch(best_match, best_score, "venue fuzzy name and location")

    return None


def find_event_match(
    db: Session,
    *,
    title: str,
    event_date: date,
    state: str,
    city: str,
    venue_name: str | None = None,
    artist_name: str | None = None,
    slug: str | None = None,
    external_source: str | None = None,
    external_id: str | None = None,
) -> DedupMatch | None:
    if external_source and external_id:
        event = db.query(Event).filter(
            Event.external_source == external_source,
            Event.external_id == external_id,
        ).first()

        if event:
            return DedupMatch(event, 100, "event external id")

    if slug:
        event = db.query(Event).filter(Event.slug == slug).first()

        if event:
            return DedupMatch(event, 98, "event slug")

    candidates = db.query(Event).filter(
        Event.event_date == event_date,
        Event.state.ilike(state),
        Event.city.ilike(city),
    ).all()

    best_match = None
    best_score = 0
    best_reason = ""

    for event in candidates:
        title_score = text_score(title, event.title)
        venue_score = text_score(venue_name, event.venue.name) if venue_name else 0
        artist_score = (
            text_score(artist_name, event.artist.name)
            if artist_name and event.artist
            else 0
        )

        has_context_match = venue_score >= 85 or artist_score >= 85
        is_strong_title_match = title_score >= 94
        is_contextual_match = title_score >= 86 and has_context_match

        if is_strong_title_match or is_contextual_match:
            score = max(
                title_score,
                int((title_score + venue_score + artist_score) / 3),
            )

            if score > best_score:
                best_match = event
                best_score = score
                best_reason = (
                    "event same date/location/title"
                    if is_strong_title_match
                    else "event same date/location plus venue or artist"
                )

    if best_match:
        return DedupMatch(best_match, best_score, best_reason)

    return None
