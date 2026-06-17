from datetime import date, time

from app.db.database import SessionLocal
from app.mock_data import mock_events
from app.models.artist import Artist
from app.models.venue import Venue
from app.models.event import Event
from app.models.ticket_link import TicketLink


def seed():
    db = SessionLocal()

    try:
        artists_by_slug = {}
        venues_by_slug = {}

        # 1. Create artists
        for item in mock_events:
            all_artists = [item["artist"], *item["lineup"]]

            for artist_data in all_artists:
                slug = artist_data["slug"]

                artist = db.query(Artist).filter(Artist.slug == slug).first()

                if artist:
                    artists_by_slug[slug] = artist
                elif slug not in artists_by_slug:
                    artist = Artist(
                        name=artist_data["name"],
                        slug=slug,
                        image_url=artist_data["image_url"],
                        genre=artist_data["genre"],
                    )
                    db.add(artist)
                    artists_by_slug[slug] = artist

        # 2. Create venues
        for item in mock_events:
            venue_data = item["venue"]
            slug = venue_data["slug"]

            venue = db.query(Venue).filter(Venue.slug == slug).first()

            if venue:
                venues_by_slug[slug] = venue
            elif slug not in venues_by_slug:
                venue = Venue(
                    name=venue_data["name"],
                    slug=slug,
                    state=venue_data["state"],
                    city=venue_data["city"],
                    address=venue_data["address"],
                    image_url=venue_data["image_url"],
                )
                db.add(venue)
                venues_by_slug[slug] = venue

        db.flush()

        # 3. Create events
        for item in mock_events:
            existing_event = db.query(Event).filter(
                Event.slug == item["slug"],
            ).first()

            if existing_event:
                continue

            event = Event(
                title=item["title"],
                slug=item["slug"],
                event_date=date.fromisoformat(item["event_date"]),
                event_time=time.fromisoformat(item["event_time"]),
                event_type=item["event_type"],
                genre=item["genre"],
                state=item["state"],
                city=item["city"],
                venue=venues_by_slug[item["venue"]["slug"]],
                artist=artists_by_slug[item["artist"]["slug"]],
                image_url=item["image_url"],
                youtube_embed_url=item["youtube_embed_url"],
                status=item["status"],
            )

            event.lineup = [
                artists_by_slug[artist["slug"]]
                for artist in item["lineup"]
            ]

            event.ticket_links = [
                TicketLink(
                    provider=link["provider"],
                    url=link["url"],
                    is_primary=link["is_primary"],
                )
                for link in item["ticket_links"]
            ]

            db.add(event)

        db.commit()

    finally:
        db.close()


if __name__ == "__main__":
    seed()
