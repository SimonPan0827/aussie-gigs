import json
import os
from datetime import date
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import urlopen

from dotenv import load_dotenv


TICKETMASTER_API_URL = "https://app.ticketmaster.com/discovery/v2"
BACKEND_ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class TicketmasterError(RuntimeError):
    pass


def get_api_key() -> str:
    api_key = os.getenv("TICKETMASTER_API_KEY")

    if not api_key:
        load_dotenv(BACKEND_ENV_FILE)
        api_key = os.getenv("TICKETMASTER_API_KEY")

    if not api_key:
        raise TicketmasterError("TICKETMASTER_API_KEY is not set")

    return api_key


def ticketmaster_get(path: str, params: dict[str, str | int | None]) -> dict:
    query_params = {
        key: value
        for key, value in params.items()
        if value is not None and value != ""
    }
    query_params["apikey"] = get_api_key()

    url = f"{TICKETMASTER_API_URL}{path}?{urlencode(query_params)}"

    try:
        with urlopen(url, timeout=20) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        message = exc.read().decode("utf-8")
        raise TicketmasterError(
            f"Ticketmaster returned {exc.code}: {message}"
        ) from exc
    except URLError as exc:
        raise TicketmasterError(f"Could not reach Ticketmaster: {exc.reason}") from exc


def search_events(
    *,
    city: str | None = None,
    state_code: str | None = None,
    keyword: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    size: int = 20,
    page: int = 0,
) -> dict:
    return ticketmaster_get(
        "/events.json",
        {
            "countryCode": "AU",
            "classificationName": "music",
            "city": city,
            "stateCode": state_code,
            "keyword": keyword,
            "startDateTime": (
                f"{start_date.isoformat()}T00:00:00Z"
                if start_date
                else None
            ),
            "endDateTime": (
                f"{end_date.isoformat()}T23:59:59Z"
                if end_date
                else None
            ),
            "includeTBA": "no",
            "includeTBD": "no",
            "includeTest": "no",
            "size": min(size, 100),
            "page": page,
            "sort": "date,asc",
        },
    )
