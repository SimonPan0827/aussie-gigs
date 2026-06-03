from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from rapidfuzz import fuzz
from app.mock_data import mock_events


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

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Aussie Gigs API is running"}

@app.get("/events")
def get_events(
    q: str | None = None,
    city: str | None = None,
    event_type: str | None = None,
    genre: list[str] | None = Query(default=None),
    start_date: str | None = None,
    end_date: str | None = None,
):
    events = mock_events

    if q:
        query = q.lower()

        events = [
            event for event in events
            if is_fuzzy_match(query, event["title"])
            or is_fuzzy_match(query, event["artist"]["name"])
            or is_fuzzy_match(query, event["venue"])
            or is_fuzzy_match(query, event["city"])
            or is_fuzzy_match(query, event["genre"])
            or any(is_fuzzy_match(query, artist["name"]) for artist in event["lineup"])
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
        selected_genres = [item.lower() for item in genre]

        events = [
            event for event in events
            if event["genre"].lower() in selected_genres
        ]

    if start_date:
        events = [
            event for event in events
            if event["event_date"] >= start_date
        ]

    if end_date:
        events = [
            event for event in events
            if event["event_date"] <= end_date
        ]

    events = sorted(events, key=lambda event: (event["event_date"], event["event_time"]))

    return events

@app.get("/events/{slug}")
def get_event_by_slug(slug: str):
    for event in mock_events:
        if event["slug"] == slug:
            return event

    raise HTTPException(status_code=404, detail="Event not found")