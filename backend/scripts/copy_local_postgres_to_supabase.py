import os
import subprocess
from pathlib import Path

from dotenv import dotenv_values


ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "backend"
DUMP_PATH = Path("/private/tmp/aussie_gigs_data.dump")

LOCAL_DATABASE_URL = "postgresql://postgres:postgres@localhost:5433/aussie_gigs"
TABLES = [
    "public.artists",
    "public.venues",
    "public.events",
    "public.event_artists",
    "public.ticket_links",
    "public.external_identities",
]


def run(args: list[str], *, env: dict[str, str] | None = None) -> None:
    subprocess.run(args, check=True, env=env)


def database_url() -> str:
    values = dotenv_values(BACKEND / ".env")
    url = values.get("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL is missing from backend/.env")
    return url


def main() -> None:
    remote_database_url = database_url()

    dump_args = [
        "pg_dump",
        LOCAL_DATABASE_URL,
        "--format=custom",
        "--data-only",
        "--no-owner",
        "--no-privileges",
        f"--file={DUMP_PATH}",
    ]
    for table in TABLES:
        dump_args.append(f"--table={table}")

    print(f"Dumping local Postgres data to {DUMP_PATH}...")
    run(dump_args)

    truncate_sql = (
        "truncate table "
        + ", ".join(TABLES)
        + " restart identity cascade;"
    )
    print("Clearing Supabase business tables...")
    run(["psql", remote_database_url, "-v", "ON_ERROR_STOP=1", "-c", truncate_sql])

    print("Restoring local data into Supabase...")
    run(
        [
            "pg_restore",
            "--data-only",
            "--no-owner",
            "--no-privileges",
            "--dbname",
            remote_database_url,
            str(DUMP_PATH),
        ],
        env={**os.environ, "PGOPTIONS": "--client-min-messages=warning"},
    )

    count_sql = """
        select 'events=' || count(*) from events
        union all select 'artists=' || count(*) from artists
        union all select 'venues=' || count(*) from venues
        union all select 'event_artists=' || count(*) from event_artists
        union all select 'ticket_links=' || count(*) from ticket_links
        union all select 'external_identities=' || count(*) from external_identities;
    """
    print("Supabase row counts after restore:")
    run(["psql", remote_database_url, "-At", "-c", count_sql])


if __name__ == "__main__":
    main()
