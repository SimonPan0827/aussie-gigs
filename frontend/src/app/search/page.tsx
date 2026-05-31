import Link from "next/link";
import EventCard from "@/components/EventCard";
import { fetchEvents } from "@/lib/api";
import type { Event } from "@/types/event";

function formatEventType(type?: string) {
  if (!type) return "All events";

  const labels: Record<string, string> = {
    concert: "Concert",
    festival: "Festival",
    "dj-set": "DJ Set",
    "party-night": "Party Night",
  };

  return labels[type] || type;
}

function getTodayDateString() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Melbourne",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(new Date());
}

function formatDateHeading(dateString: string) {
  return new Intl.DateTimeFormat("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Australia/Melbourne",
  }).format(new Date(`${dateString}T00:00:00`));
}

function groupEventsByDate(events: Event[]) {
  return events.reduce<Record<string, Event[]>>((groups, event) => {
    if (!groups[event.event_date]) {
      groups[event.event_date] = [];
    }

    groups[event.event_date].push(event);
    return groups;
  }, {});
}

type SearchTab =
  | "all"
  | "upcoming"
  | "past"
  | "artists"
  | "events"
  | "venues"
  | "cities";

function getActiveTab(tab?: string): SearchTab {
  const validTabs: SearchTab[] = [
    "all",
    "upcoming",
    "past",
    "artists",
    "events",
    "venues",
    "cities",
  ];

  return validTabs.includes(tab as SearchTab) ? (tab as SearchTab) : "all";
}

function buildTabHref(
  params: {
    q?: string;
    city?: string;
    event_type?: string;
    genre?: string;
  },
  tab: SearchTab
) {
  const searchParams = new URLSearchParams();

  if (params.q) searchParams.set("q", params.q);
  if (params.city) searchParams.set("city", params.city);
  if (params.event_type) searchParams.set("event_type", params.event_type);
  if (params.genre) searchParams.set("genre", params.genre);

  searchParams.set("tab", tab);

  return `/search?${searchParams.toString()}`;
}

function getUniqueArtists(events: Event[]) {
  const artists = new Map<string, Event>();

  events.forEach((event) => {
    artists.set(event.artist, event);
  });

  return Array.from(artists.entries());
}

function getUniqueVenues(events: Event[]) {
  const venues = new Map<string, Event>();

  events.forEach((event) => {
    venues.set(event.venue, event);
  });

  return Array.from(venues.entries());
}

function getUniqueCities(events: Event[]) {
  const cities = new Map<string, Event>();

  events.forEach((event) => {
    cities.set(event.city, event);
  });

  return Array.from(cities.entries());
}

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    city?: string;
    event_type?: string;
    genre?: string;
    tab?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const activeTab = getActiveTab(params.tab);

  const events: Event[] = await fetchEvents({
    q: params.q,
    city: params.city,
    event_type: params.event_type,
    genre: params.genre,
  });
  
  const today = getTodayDateString();

  const sortedEvents = [...events].sort((a, b) => {
    const dateCompare = a.event_date.localeCompare(b.event_date);

    if (dateCompare !== 0) {
      return dateCompare;
    }

    return a.event_time.localeCompare(b.event_time);
  });

  const upcomingEvents = sortedEvents.filter(
    (event) => event.event_date >= today
  );

  const pastEvents = sortedEvents
    .filter((event) => event.event_date < today)
    .reverse();

  const allEvents = [...upcomingEvents, ...pastEvents];

  const eventsForCurrentTab =
    activeTab === "all"
      ? allEvents
      : activeTab === "past"
        ? pastEvents
        : upcomingEvents;

  const groupedEvents = groupEventsByDate(eventsForCurrentTab);
  const groupedDates = Array.from(
    new Set(eventsForCurrentTab.map((event) => event.event_date))
  );

  const artists = getUniqueArtists(events);
  const venues = getUniqueVenues(events);
  const cities = getUniqueCities(events);

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-black px-6 py-16 text-white">
        <div className="mx-auto max-w-6xl">
          <Link href="/" className="text-sm text-gray-300 hover:text-white">
            ← Back home
          </Link>

          <h1 className="mt-8 text-5xl font-bold">Search events</h1>

          <p className="mt-4 max-w-2xl text-gray-300">
            Find upcoming concerts, gigs and festivals across Australia.
          </p>

          <form action="/search" className="mt-8 grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_auto]">
            <input
              name="q"
              defaultValue={params.q || ""}
              placeholder="Search artist, venue or event"
              className="rounded-full px-5 py-3 text-black outline-none"
            />

            <select
              name="city"
              defaultValue={params.city || ""}
              className="rounded-full px-5 py-3 text-black outline-none"
            >
              <option value="">All cities</option>
              <option value="Melbourne">Melbourne</option>
              <option value="Sydney">Sydney</option>
              <option value="Brisbane">Brisbane</option>
              <option value="Perth">Perth</option>
              <option value="Adelaide">Adelaide</option>
            </select>

            <button
              type="submit"
              className="rounded-full bg-white px-6 py-3 font-medium text-black transition hover:bg-gray-200"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              {formatEventType(params.event_type)}
            </h2>
            <p className="mt-1 text-gray-500">
              {activeTab === "artists" &&
                `${artists.length} artist${artists.length === 1 ? "" : "s"} found`}

              {activeTab === "venues" &&
                `${venues.length} venue${venues.length === 1 ? "" : "s"} found`}

              {activeTab === "cities" &&
                `${cities.length} cit${cities.length === 1 ? "y" : "ies"} found`}

              {(activeTab === "all" ||
                activeTab === "upcoming" ||
                activeTab === "events") &&
                `${upcomingEvents.length} upcoming event${
                  upcomingEvents.length === 1 ? "" : "s"
                } found`}

              {activeTab === "past" &&
                `${pastEvents.length} past event${
                  pastEvents.length === 1 ? "" : "s"
                } found`}
            </p>
          </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {[
                ["all", "All results"],
                ["upcoming", "Upcoming"],
                ["past", "Past"],
                ["artists", "Artists"],
                ["events", "Events"],
                ["venues", "Venues"],
                ["cities", "Cities"],
              ].map(([value, label]) => {
                const tabValue = value as SearchTab;
                const isActive = activeTab === tabValue;

                return (
                  <Link
                    key={value}
                    href={buildTabHref(
                      {
                        q: params.q,
                        city: params.city,
                        event_type: params.event_type,
                        genre: params.genre,
                      },
                      tabValue
                    )}
                    className={`rounded-full border px-5 py-2 text-sm font-medium transition ${
                      isActive
                        ? "border-black bg-black text-white"
                        : "border-gray-300 bg-white text-gray-700 hover:border-black"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
        </div>

        {(activeTab === "all" ||
          activeTab === "upcoming" ||
          activeTab === "events" ||
          activeTab === "past") && (
          <>
            {eventsForCurrentTab.length > 0 ? (
              <div className="space-y-10">
                {groupedDates.map((date) => (
                  <section key={date}>
                    <div className="mb-4 flex items-center gap-4">
                      <h3 className="text-xl font-bold text-gray-900">
                        {formatDateHeading(date)}
                      </h3>

                      <div className="h-px flex-1 bg-gray-200" />
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      {groupedEvents[date].map((event) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          isPast={event.event_date < today}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900">
                  No events found
                </h3>

                <p className="mt-2 text-gray-500">
                  Try another artist, city or genre.
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === "artists" && (
          <div className="grid gap-4 md:grid-cols-2">
            {artists.map(([artist, event]) => (
              <Link
                key={artist}
                href={`/search?q=${encodeURIComponent(artist)}&tab=events`}
                className="rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Artist
                </p>
                <h3 className="mt-2 text-xl font-bold text-gray-900">{artist}</h3>
                <p className="mt-1 text-gray-500">{event.genre}</p>
              </Link>
            ))}
          </div>
        )}

        {activeTab === "venues" && (
          <div className="grid gap-4 md:grid-cols-2">
            {venues.map(([venue, event]) => (
              <Link
                key={venue}
                href={`/search?q=${encodeURIComponent(venue)}&tab=events`}
                className="rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Venue
                </p>
                <h3 className="mt-2 text-xl font-bold text-gray-900">{venue}</h3>
                <p className="mt-1 text-gray-500">{event.city}</p>
              </Link>
            ))}
          </div>
        )}

        {activeTab === "cities" && (
          <div className="grid gap-4 md:grid-cols-2">
            {cities.map(([city]) => (
              <Link
                key={city}
                href={`/search?city=${encodeURIComponent(city)}&tab=events`}
                className="rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  City
                </p>
                <h3 className="mt-2 text-xl font-bold text-gray-900">{city}</h3>
                <p className="mt-1 text-gray-500">Australia</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}