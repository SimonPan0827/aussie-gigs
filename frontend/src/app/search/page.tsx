import Link from "next/link";
import EventCard from "@/components/EventCard";
import { fetchEvents } from "@/lib/api";
import {
  FALLBACK_ARTIST_IMAGE,
  FALLBACK_VENUE_IMAGE,
  imageOrFallback,
} from "@/lib/images";
import type { Event } from "@/types/event";
import type { Artist } from "@/types/artist";
import { GENRES, type Genre } from "@/types/genre";
import { AU_STATES, type AustralianState } from "@/types/location";
import type { Venue } from "@/types/venue";
import Navbar from "@/components/Navbar";
import CustomDatePicker from "@/components/CustomDatePicker";
import Pagination from "@/components/Pagination";
import SearchLocationFilter from "@/components/SearchLocationFilter";

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
  | "venues";

function getActiveTab(tab?: string): SearchTab {
  const validTabs: SearchTab[] = [
    "all",
    "upcoming",
    "past",
    "artists",
    "events",
    "venues",
  ];

  return validTabs.includes(tab as SearchTab) ? (tab as SearchTab) : "all";
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
  const venues = new Map<string, Venue>();

  events.forEach((event) => {
    venues.set(event.venue.slug, event.venue);
  });

  return Array.from(venues.values());
}

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    state?: string;
    city?: string;
    event_type?: string;
    genre?: string | string[];
    start_date?: string;
    end_date?: string;
    tab?: string;
    page?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const selectedState = getSelectedState(params.state);
  const selectedGenres = getSelectedGenres(params.genre);
  const allEventsForNavbar: Event[] = await fetchEvents();
  const cityOptionsByState = getCityOptionsByState(allEventsForNavbar);
  const selectedCity = getSelectedCity(
    params.city,
    selectedState,
    cityOptionsByState
  );
  const normalizedParams = {
    ...params,
    state: selectedState,
    city: selectedCity,
  };
  const activeTab = getActiveTab(params.tab);

  const events: Event[] = await fetchEvents({
    q: params.q,
    state: selectedState,
    city: selectedCity,
    event_type: params.event_type,
    genre: selectedGenres,
    start_date: params.start_date,
    end_date: params.end_date,
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
  
  const parsedPage = Number(params.page || "1");
  const currentPage = Number.isFinite(parsedPage) && parsedPage > 0
    ? Math.floor(parsedPage)
    : 1;
  const EVENTS_PER_PAGE = 10;

  const totalPages = Math.max(
    Math.ceil(eventsForCurrentTab.length / EVENTS_PER_PAGE),
    1
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedEvents = eventsForCurrentTab.slice(
    (safeCurrentPage - 1) * EVENTS_PER_PAGE,
    safeCurrentPage * EVENTS_PER_PAGE
  );

  const groupedEvents = groupEventsByDate(paginatedEvents);
  const groupedDates = Array.from(
    new Set(paginatedEvents.map((event) => event.event_date))
  );

  const artists = getUniqueArtists(events);
  const venues = getUniqueVenues(events);
  const currentSearchHref = buildSearchHref(normalizedParams, {});

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
            <div className="flex flex-wrap items-center gap-3 rounded-[2rem] bg-white px-5 py-3 md:flex-nowrap md:rounded-full">
              <SearchLocationFilter
                selectedState={selectedState}
                selectedCity={selectedCity}
                cityOptionsByState={cityOptionsByState}
                q={params.q}
                eventType={params.event_type}
                genres={selectedGenres}
                startDate={params.start_date}
                endDate={params.end_date}
                tab={params.tab}
              />

              <span className="text-gray-400">⌕</span>

              <input
                name="q"
                defaultValue={params.q || ""}
                placeholder="Search artist, event, venue or city"
                className="min-w-48 flex-1 bg-transparent text-base text-black outline-none"
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
                clearHref={buildSearchHref(normalizedParams, {
                  start_date: null,
                  page: null,
                })}
              />

              <CustomDatePicker
                name="end_date"
                value={params.end_date || ""}
                minDate={params.start_date || getTodayDateString()}
                clearHref={buildSearchHref(normalizedParams, {
                  end_date: null,
                  page: null,
                })}
              />

              <input type="hidden" name="q" value={params.q || ""} />

              {params.event_type && (
                <input type="hidden" name="event_type" value={params.event_type} />
              )}

              {selectedState && (
                <input type="hidden" name="state" value={selectedState} />
              )}

              {selectedCity && (
                <input type="hidden" name="city" value={selectedCity} />
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
              {GENRES.map((genre) => {
                const isSelected = selectedGenres.includes(genre);

                const nextGenres = isSelected
                  ? selectedGenres.filter((item) => item !== genre)
                  : [...selectedGenres, genre];

                return (
                  <Link
                    key={genre}
                    href={buildSearchHref(normalizedParams, {
                      genre: nextGenres,
                      page: null,
                    })}
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
              ].map(([value, label]) => {
                const tabValue = value as SearchTab;
                const isActive = activeTab === tabValue;

                return (
                  <Link
                    key={value}
                    href={buildSearchHref(normalizedParams, {
                      tab: tabValue,
                      page: null,
                    })}
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
                          returnHref={currentSearchHref}
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
            <Pagination
              currentPage={safeCurrentPage}
              totalPages={totalPages}
              buildPageHref={(page) => buildSearchHref(normalizedParams, { page })}
            />
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
                  src={imageOrFallback(artist.image_url, FALLBACK_ARTIST_IMAGE)}
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
            {venues.map((venue) => (
              <Link
                key={venue.slug}
                href={`/venues/${venue.slug}`}
                className="rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <img
                  src={imageOrFallback(venue.image_url, FALLBACK_VENUE_IMAGE)}
                  alt={venue.name}
                  className="h-40 w-full rounded-xl object-cover"
                />

                <h3 className="mt-4 text-xl font-bold text-gray-900">
                  {venue.name}
                </h3>

                <p className="mt-1 text-gray-500">
                  {venue.city}
                </p>
              </Link>
            ))}
          </div>
        )}

      </section>
    </main>
  );
}

function getSelectedGenres(genre?: string | string[]): Genre[] {
  if (!genre) return [];

  const genres = Array.isArray(genre) ? genre : [genre];

  return genres.filter((item): item is Genre =>
    GENRES.includes(item as Genre)
  );
}

function getSelectedState(state?: string): AustralianState | undefined {
  return AU_STATES.some((item) => item.code === state)
    ? (state as AustralianState)
    : undefined;
}

function getCityOptionsByState(events: Event[]) {
  const cityOptionsByState = AU_STATES.reduce(
    (options, state) => ({
      ...options,
      [state.code]: new Set<string>(),
    }),
    {} as Record<AustralianState, Set<string>>
  );

  events.forEach((event) => {
    if (event.city && cityOptionsByState[event.state]) {
      cityOptionsByState[event.state].add(event.city);
    }
  });

  return AU_STATES.reduce(
    (options, state) => ({
      ...options,
      [state.code]: Array.from(cityOptionsByState[state.code]).sort((a, b) =>
        a.localeCompare(b)
      ),
    }),
    {} as Record<AustralianState, string[]>
  );
}

function getSelectedCity(
  city: string | undefined,
  state: AustralianState | undefined,
  cityOptionsByState: Record<AustralianState, string[]>
) {
  if (!city || !state) return undefined;

  return cityOptionsByState[state]?.includes(city) ? city : undefined;
}

function buildSearchHref(
  params: {
    q?: string;
    state?: string;
    city?: string;
    event_type?: string;
    genre?: string | string[];
    start_date?: string;
    end_date?: string;
    tab?: string;
    page?: string;
  },
  overrides: {
    q?: string | null;
    state?: AustralianState | null;
    city?: string | null;
    event_type?: string | null;
    genre?: Genre[] | null;
    start_date?: string | null;
    end_date?: string | null;
    tab?: string | null;
    page?: number | string | null;
  }
) {
  const searchParams = new URLSearchParams();

  const nextQ = overrides.q !== undefined ? overrides.q : params.q;
  const nextState =
    overrides.state !== undefined ? overrides.state : getSelectedState(params.state);
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
  const nextPage = overrides.page !== undefined ? overrides.page : params.page;

  const nextGenres =
    overrides.genre !== undefined
      ? overrides.genre || []
      : getSelectedGenres(params.genre);

  if (nextQ) searchParams.set("q", nextQ);
  if (nextState) searchParams.set("state", nextState);
  if (nextCity) searchParams.set("city", nextCity);
  if (nextEventType) searchParams.set("event_type", nextEventType);
  if (nextStartDate) searchParams.set("start_date", nextStartDate);
  if (nextEndDate) searchParams.set("end_date", nextEndDate);
  if (nextTab) searchParams.set("tab", nextTab);
  if (nextPage) searchParams.set("page", String(nextPage));

  nextGenres.forEach((genre) => {
    searchParams.append("genre", genre);
  });

  const queryString = searchParams.toString();

  return queryString ? `/search?${queryString}` : "/search";
}
