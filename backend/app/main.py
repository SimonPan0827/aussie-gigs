from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from rapidfuzz import fuzz

app = FastAPI(title="Aussie Gigs API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

mock_events = [
    {
        "id": 1,
        "title": "Ninajirachi - Live in Melbourne",
        "slug": "ninajirachi-live-melbourne",
        "event_date": "2026-07-16",
        "event_time": "20:00",
        "event_type": "concert",
        "genre": "electronic",
        "city": "Melbourne",
        "venue": "Forum Melbourne",
        "artist": "Ninajirachi",
        "lineup": ["Ninajirachi"],
        "image_url": "https://images.unsplash.com/photo-1501386761578-eac5c94b800a",
        "status": "upcoming",
        "ticket_links": [
            {
                "provider": "Ticketek",
                "url": "https://premier.ticketek.com.au/",
                "is_primary": True,
            }
        ],
    },
    {
        "id": 2,
        "title": "Laneway Festival Melbourne",
        "slug": "laneway-festival-melbourne",
        "event_date": "2026-02-08",
        "event_time": "12:00",
        "event_type": "festival",
        "genre": "pop",
        "city": "Melbourne",
        "venue": "Flemington Park",
        "artist": "Laneway Festival",
        "lineup": ["Artist A", "Artist B", "Artist C"],
        "image_url": "https://images.unsplash.com/photo-1459749411175-04bf5292ceea",
        "status": "upcoming",
        "ticket_links": [
            {
                "provider": "Official Website",
                "url": "https://www.lanewayfestival.com/",
                "is_primary": True,
            }
        ],
    },
]

def is_fuzzy_match(query: str, text: str, threshold: int = 70) -> bool:
    if not query or not text:
        return False

    score = fuzz.partial_ratio(query.lower(), text.lower())
    return score >= threshold

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Aussie Gigs API is running"}

@app.get("/events")
def get_events(
    q: str | None = None,
    city: str | None = None,
    event_type: str | None = None,
    genre: str | None = None,
):
    events = mock_events

    if q:
        query = q.lower()

        events = [
            event for event in events
            if is_fuzzy_match(query, event["title"])
            or is_fuzzy_match(query, event["artist"])
            or is_fuzzy_match(query, event["venue"])
            or is_fuzzy_match(query, event["city"])
            or is_fuzzy_match(query, event["genre"])
            or any(is_fuzzy_match(query, artist) for artist in event["lineup"])
        ]

    if city:
        events = [
            event for event in events
            if event["city"].lower() == city.lower()
        ]

    if event_type:
        events = [
            event for event in events
            if event["event_type"].lower() == event_type.lower()
        ]

    if genre:
        events = [
            event for event in events
            if event["genre"].lower() == genre.lower()
        ]

    events = sorted(events, key=lambda event: event["event_date"])
    
    return events

@app.get("/events/{slug}")
def get_event_by_slug(slug: str):
    for event in mock_events:
        if event["slug"] == slug:
            return event

    raise HTTPException(status_code=404, detail="Event not found")