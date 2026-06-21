import argparse
import os
import time

from app.db.database import SessionLocal
from app.services.sync_logs import complete_sync_log, create_sync_log, fail_sync_log
from app.services.ticketmaster_sync import sync_ticketmaster_upcoming


DEFAULT_STATE_CODES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"]


def parse_state_codes(value: str | None) -> list[str]:
    if not value:
        return DEFAULT_STATE_CODES

    return [
        state_code.strip().upper()
        for state_code in value.split(",")
        if state_code.strip()
    ]


def run_state_sync(state_code: str, size: int) -> None:
    db = SessionLocal()
    sync_log = create_sync_log(
        db,
        source="ticketmaster",
        sync_type="scheduled-upcoming",
        state_code=state_code,
    )

    try:
        result = sync_ticketmaster_upcoming(
            db,
            state_code=state_code,
            size=size,
        )
    except Exception as exc:
        fail_sync_log(db, sync_log, exc)
        print(f"Ticketmaster sync failed for {state_code}: {exc}", flush=True)
    else:
        complete_sync_log(db, sync_log, result)
        print(
            "Ticketmaster sync finished for "
            f"{state_code}: fetched={result.fetched_events}, "
            f"created={result.created_events}, updated={result.updated_events}",
            flush=True,
        )
    finally:
        db.close()


def run_once(state_codes: list[str], size: int) -> None:
    for state_code in state_codes:
        run_state_sync(state_code, size)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Sync upcoming Ticketmaster events into the database.",
    )
    parser.add_argument(
        "--states",
        default=os.getenv("TICKETMASTER_SYNC_STATES"),
        help="Comma-separated AU state codes. Defaults to every state and territory.",
    )
    parser.add_argument(
        "--size",
        type=int,
        default=int(os.getenv("TICKETMASTER_SYNC_PAGE_SIZE", "100")),
        help="Ticketmaster page size. The sync service clamps this to 50-100.",
    )
    parser.add_argument(
        "--loop",
        action="store_true",
        help="Run forever, sleeping between syncs.",
    )
    parser.add_argument(
        "--interval-hours",
        type=float,
        default=float(os.getenv("TICKETMASTER_SYNC_INTERVAL_HOURS", "24")),
        help="Sleep interval when --loop is used.",
    )
    args = parser.parse_args()

    state_codes = parse_state_codes(args.states)

    while True:
        run_once(state_codes, args.size)

        if not args.loop:
            break

        sleep_seconds = max(args.interval_hours, 1 / 60) * 60 * 60
        print(
            f"Ticketmaster sync sleeping for {args.interval_hours} hours",
            flush=True,
        )
        time.sleep(sleep_seconds)


if __name__ == "__main__":
    main()
