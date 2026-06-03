import Link from "next/link";
import EventCard from "@/components/EventCard";
import { fetchEvents } from "@/lib/api";
import type { Event } from "@/types/event";
import type { Artist } from "@/types/artist";
import Navbar from "@/components/Navbar";
import DateInput from "@/components/DateInput";
import CustomDatePicker from "@/components/CustomDatePicker";

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
    genre?: string | string[];
    start_date?: string;
    end_date?: string;
  },
  tab: SearchTab
) {
  const searchParams = new URLSearchParams();

  if (params.q) searchParams.set("q", params.q);
  if (params.city) searchParams.set("city", params.city);
  if (params.event_type) searchParams.set("event_type", params.event_type);
  if (params.start_date) searchParams.set("start_date", params.start_date);
  if (params.end_date) searchParams.set("end_date", params.end_date);

  const selectedGenres = getSelectedGenres(params.genre);

  selectedGenres.forEach((genre) => {
    searchParams.append("genre", genre);
  });

  searchParams.set("tab", tab);

  return `/search?${searchParams.toString()}`;
}

function getUniqueArtists(events: Event[]) {
  const artists = new Map<string, Artist>();

  events.forEach((event) => {
    artists.set(event.artist.slug, event.artist);

    event.lineup.forEach((artist) => {
      artists.set(artist.slug, artist);
    });
  });

  return Array.from(artists.values());
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
    genre?: string | string[];
    start_date?: string;
    end_date?: string;
    tab?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const selectedGenres = getSelectedGenres(params.genre);

  const activeTab = getActiveTab(params.tab);

  const events: Event[] = await fetchEvents({
  q: params.q,
  city: params.city,
  event_type: params.event_type,
  genre: selectedGenres,
  start_date: params.start_date,
  end_date: params.end_date,
  });

  const allEventsForNavbar: Event[] = await fetchEvents();
  
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

  const GENRE_OPTIONS = [
  "electronic",
  "indie",
  "pop",
  "rock",
  "hip-hop",
  "jazz",
  "dance",
  "alternative",
];

  const artists = getUniqueArtists(events);
  const venues = getUniqueVenues(events);
  const cities = getUniqueCities(events);

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar events={allEventsForNavbar} />
      <section className="bg-black px-6 py-16 text-white">
        <div className="mx-auto max-w-6xl">
          <Link href="/" className="text-sm text-gray-300 hover:text-white">
            ← Back home
          </Link>

          <h1 className="mt-8 text-5xl font-bold">Search events</h1>

          <p className="mt-4 max-w-2xl text-gray-300">
            Find upcoming concerts, gigs and festivals across Australia.
          </p>

          {/* Search bar */}
          <form action="/search" className="mt-10 max-w-6xl">
            <div className="flex items-center gap-3 rounded-full bg-white px-5 py-3">
              <span className="text-gray-400">⌕</span>

              <input
                name="q"
                defaultValue={params.q || ""}
                placeholder="Search artist, event, venue or city"
                className="flex-1 bg-transparent text-base text-black outline-none"
              />

              {params.event_type && (
                <input type="hidden" name="event_type" value={params.event_type} />
              )}

              {selectedGenres.map((genre) => (
                <input key={genre} type="hidden" name="genre" value={genre} />
              ))}

              {params.start_date && (
                <input type="hidden" name="start_date" value={params.start_date} />
              )}

              {params.end_date && (
                <input type="hidden" name="end_date" value={params.end_date} />
              )}

              <input type="hidden" name="tab" value={params.tab || "all"} />

              <button
                type="submit"
                className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
              >
                Search
              </button>
            </div>
          </form>

          {/* Date filter */}
          <form
            action="/search"
            className="mt-5 max-w-6xl rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <div className="flex items-center gap-3">
              <p className="shrink-0 whitespace-nowrap text-sm font-medium text-gray-300">
                Filter by day
              </p>

              <CustomDatePicker
                name="start_date"
                value={params.start_date || ""}
                minDate={getTodayDateString()}
                clearHref={buildSearchHref(params, { start_date: null })}
              />

              <CustomDatePicker
                name="end_date"
                value={params.end_date || ""}
                minDate={params.start_date || getTodayDateString()}
                clearHref={buildSearchHref(params, { end_date: null })}
              />

              <input type="hidden" name="q" value={params.q || ""} />

              {params.event_type && (
                <input type="hidden" name="event_type" value={params.event_type} />
              )}

              {selectedGenres.map((genre) => (
                <input key={genre} type="hidden" name="genre" value={genre} />
              ))}

              <input type="hidden" name="tab" value={params.tab || "all"} />

              <button
                type="submit"
                className="shrink-0 whitespace-nowrap rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-gray-200"
              >
                Apply
              </button>
            </div>
          </form>
          <div className="mt-6">
            <p className="mb-3 text-sm font-semibold text-gray-300">Genre</p>

            <div className="flex flex-wrap gap-2">
              {GENRE_OPTIONS.map((genre) => {
                const isSelected = selectedGenres.includes(genre);

                const nextGenres = isSelected
                  ? selectedGenres.filter((item) => item !== genre)
                  : [...selectedGenres, genre];

                return (
                  <Link
                    key={genre}
                    href={buildFilterHref(params, nextGenres)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                      isSelected
                        ? "border-white bg-white text-black"
                        : "border-white/20 bg-white/5 text-gray-300 hover:border-white hover:text-white"
                    }`}
                  >
                    <span>{genre}</span>
                    {isSelected && <span className="text-xs">×</span>}
                  </Link>
                );
              })}
            </div>
          </div>
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
            {artists.map((artist) => (
              <Link
                key={artist.slug}
                href={`/artists/${artist.slug}`}
                className="flex items-center gap-4 rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <img
                  src={artist.image_url}
                  alt={artist.name}
                  className="h-16 w-16 rounded-full object-cover"
                />

                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Artist
                  </p>

                  <h3 className="mt-1 text-xl font-bold text-gray-900">
                    {artist.name}
                  </h3>

                  <p className="mt-1 text-gray-500">{artist.genre}</p>
                </div>

                <span className="ml-auto text-2xl text-gray-400">→</span>
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

function getSelectedGenres(genre?: string | string[]) {
  if (!genre) return [];

  return Array.isArray(genre) ? genre : [genre];
}

function buildFilterHref(
  params: {
    q?: string;
    city?: string;
    event_type?: string;
    genre?: string | string[];
    start_date?: string;
    end_date?: string;
    tab?: string;
  },
  nextGenres: string[]
) {
  const searchParams = new URLSearchParams();

  if (params.q) searchParams.set("q", params.q);
  if (params.city) searchParams.set("city", params.city);
  if (params.event_type) searchParams.set("event_type", params.event_type);
  if (params.start_date) searchParams.set("start_date", params.start_date);
  if (params.end_date) searchParams.set("end_date", params.end_date);
  if (params.tab) searchParams.set("tab", params.tab);

  nextGenres.forEach((genre) => {
    searchParams.append("genre", genre);
  });

  const queryString = searchParams.toString();

  return queryString ? `/search?${queryString}` : "/search";
}

function buildSearchHref(
  params: {
    q?: string;
    city?: string;
    event_type?: string;
    genre?: string | string[];
    start_date?: string;
    end_date?: string;
    tab?: string;
  },
  overrides: {
    q?: string | null;
    city?: string | null;
    event_type?: string | null;
    genre?: string[] | null;
    start_date?: string | null;
    end_date?: string | null;
    tab?: string | null;
  }
) {
  const searchParams = new URLSearchParams();

  const nextQ = overrides.q !== undefined ? overrides.q : params.q;
  const nextCity = overrides.city !== undefined ? overrides.city : params.city;
  const nextEventType =
    overrides.event_type !== undefined
      ? overrides.event_type
      : params.event_type;
  const nextStartDate =
    overrides.start_date !== undefined ? overrides.start_date : params.start_date;
  const nextEndDate =
    overrides.end_date !== undefined ? overrides.end_date : params.end_date;
  const nextTab = overrides.tab !== undefined ? overrides.tab : params.tab;

  const nextGenres =
    overrides.genre !== undefined
      ? overrides.genre || []
      : getSelectedGenres(params.genre);

  if (nextQ) searchParams.set("q", nextQ);
  if (nextCity) searchParams.set("city", nextCity);
  if (nextEventType) searchParams.set("event_type", nextEventType);
  if (nextStartDate) searchParams.set("start_date", nextStartDate);
  if (nextEndDate) searchParams.set("end_date", nextEndDate);
  if (nextTab) searchParams.set("tab", nextTab);

  nextGenres.forEach((genre) => {
    searchParams.append("genre", genre);
  });

  const queryString = searchParams.toString();

  return queryString ? `/search?${queryString}` : "/search";
}