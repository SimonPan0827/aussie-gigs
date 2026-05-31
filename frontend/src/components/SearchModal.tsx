"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Event } from "@/types/event";

type SearchModalProps = {
  events: Event[];
};

type SearchTab = "top" | "artists" | "events" | "venues" | "cities";

export default function SearchModal({ events }: SearchModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("top");

  const normalizedQuery = query.trim().toLowerCase();

  const filteredEvents = useMemo(() => {
    if (!normalizedQuery) {
      return events.slice(0, 6);
    }

    return events
      .filter((event) => {
        return (
          event.title.toLowerCase().includes(normalizedQuery) ||
          event.artist.toLowerCase().includes(normalizedQuery) ||
          event.venue.toLowerCase().includes(normalizedQuery) ||
          event.city.toLowerCase().includes(normalizedQuery) ||
          event.event_type.toLowerCase().includes(normalizedQuery) ||
          event.genre?.toLowerCase().includes(normalizedQuery)
        );
      })
      .slice(0, 8);
  }, [events, normalizedQuery]);

  const artists = useMemo(() => {
    const uniqueArtists = new Map<string, Event>();

    events.forEach((event) => {
      if (
        !normalizedQuery ||
        event.artist.toLowerCase().includes(normalizedQuery)
      ) {
        uniqueArtists.set(event.artist, event);
      }
    });

    return Array.from(uniqueArtists.entries()).slice(0, 8);
  }, [events, normalizedQuery]);

  const venues = useMemo(() => {
    const uniqueVenues = new Map<string, Event>();

    events.forEach((event) => {
      if (
        !normalizedQuery ||
        event.venue.toLowerCase().includes(normalizedQuery)
      ) {
        uniqueVenues.set(event.venue, event);
      }
    });

    return Array.from(uniqueVenues.entries()).slice(0, 8);
  }, [events, normalizedQuery]);

  const cities = useMemo(() => {
    const uniqueCities = new Map<string, Event>();

    events.forEach((event) => {
      if (
        !normalizedQuery ||
        event.city.toLowerCase().includes(normalizedQuery)
      ) {
        uniqueCities.set(event.city, event);
      }
    });

    return Array.from(uniqueCities.entries()).slice(0, 8);
  }, [events, normalizedQuery]);

  const viewAllHref = query.trim()
    ? `/search?q=${encodeURIComponent(query.trim())}`
    : "/search";

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex w-full max-w-md items-center gap-3 rounded-full bg-white px-5 py-3 text-left text-sm text-gray-500 shadow-sm transition hover:bg-gray-100"
      >
        <span className="text-lg">⌕</span>
        <span>Search events, artists, venues or cities</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 py-8">
          <div className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between px-6 pt-6">
              <h2 className="text-2xl font-bold text-gray-900">Search</h2>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-2xl leading-none text-gray-600 hover:bg-gray-100"
                aria-label="Close search"
              >
                ×
              </button>
            </div>

            <div className="mx-6 mt-6 flex items-center gap-3 rounded-2xl border border-gray-200 px-4 py-3 focus-within:border-black">
              <span className="text-2xl text-gray-500">⌕</span>

              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                autoFocus
                placeholder="Search artist, event, venue or city"
                className="min-w-0 flex-1 text-lg text-gray-900 outline-none"
              />

              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="mt-6 flex gap-6 overflow-x-auto border-b border-gray-200 px-6">
              {[
                ["top", "Top Results"],
                ["artists", "Artists"],
                ["events", "Events"],
                ["venues", "Venues"],
                ["cities", "Cities"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setActiveTab(value as SearchTab)}
                  className={`whitespace-nowrap pb-3 text-sm font-semibold ${
                    activeTab === value
                      ? "border-b-2 border-black text-black"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {activeTab === "top" && (
                <div className="grid gap-5 md:grid-cols-2">
                  <ResultSection title="Events">
                    {filteredEvents.length > 0 ? (
                      filteredEvents.slice(0, 3).map((event) => (
                        <EventResult key={event.id} event={event} />
                      ))
                    ) : (
                      <EmptyResult text="No matching events." />
                    )}
                  </ResultSection>

                  <ResultSection title="Artists">
                    {artists.length > 0 ? (
                      artists.slice(0, 3).map(([artist, event]) => (
                        <SimpleResult
                          key={artist}
                          label="ARTIST"
                          title={artist}
                          subtitle={event.genre || "Artist"}
                          href={`/search?q=${encodeURIComponent(artist)}`}
                          onClick={() => setIsOpen(false)}
                        />
                      ))
                    ) : (
                      <EmptyResult text="No matching artists." />
                    )}
                  </ResultSection>

                  <ResultSection title="Venues">
                    {venues.length > 0 ? (
                      venues.slice(0, 2).map(([venue, event]) => (
                        <SimpleResult
                          key={venue}
                          label="VENUE"
                          title={venue}
                          subtitle={event.city}
                          href={`/search?q=${encodeURIComponent(venue)}`}
                          onClick={() => setIsOpen(false)}
                        />
                      ))
                    ) : (
                      <EmptyResult text="No matching venues." />
                    )}
                  </ResultSection>

                  <ResultSection title="Cities">
                    {cities.length > 0 ? (
                      cities.slice(0, 2).map(([city]) => (
                        <SimpleResult
                          key={city}
                          label="CITY"
                          title={city}
                          subtitle="Australia"
                          href={`/search?city=${encodeURIComponent(city)}`}
                          onClick={() => setIsOpen(false)}
                        />
                      ))
                    ) : (
                      <EmptyResult text="No matching cities." />
                    )}
                  </ResultSection>
                </div>
              )}

              {activeTab === "events" && (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredEvents.length > 0 ? (
                    filteredEvents.map((event) => (
                      <EventResult key={event.id} event={event} />
                    ))
                  ) : (
                    <EmptyResult text="No matching events." />
                  )}
                </div>
              )}

              {activeTab === "artists" && (
                <div className="grid gap-4 md:grid-cols-2">
                  {artists.length > 0 ? (
                    artists.map(([artist, event]) => (
                      <SimpleResult
                        key={artist}
                        label="ARTIST"
                        title={artist}
                        subtitle={event.genre || "Artist"}
                        href={`/search?q=${encodeURIComponent(artist)}`}
                        onClick={() => setIsOpen(false)}
                      />
                    ))
                  ) : (
                    <EmptyResult text="No matching artists." />
                  )}
                </div>
              )}

              {activeTab === "venues" && (
                <div className="grid gap-4 md:grid-cols-2">
                  {venues.length > 0 ? (
                    venues.map(([venue, event]) => (
                      <SimpleResult
                        key={venue}
                        label="VENUE"
                        title={venue}
                        subtitle={event.city}
                        href={`/search?q=${encodeURIComponent(venue)}`}
                        onClick={() => setIsOpen(false)}
                      />
                    ))
                  ) : (
                    <EmptyResult text="No matching venues." />
                  )}
                </div>
              )}

              {activeTab === "cities" && (
                <div className="grid gap-4 md:grid-cols-2">
                  {cities.length > 0 ? (
                    cities.map(([city]) => (
                      <SimpleResult
                        key={city}
                        label="CITY"
                        title={city}
                        subtitle="Australia"
                        href={`/search?city=${encodeURIComponent(city)}`}
                        onClick={() => setIsOpen(false)}
                      />
                    ))
                  ) : (
                    <EmptyResult text="No matching cities." />
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 px-6 py-4">
              <Link
                href={viewAllHref}
                onClick={() => setIsOpen(false)}
                className="flex w-full justify-center rounded-full border px-6 py-3 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50"
              >
                View all results →
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ResultSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </h3>

      <div className="space-y-3">{children}</div>
    </div>
  );
}

function EventResult({ event }: { event: Event }) {
  return (
    <Link
      href={`/events/${event.slug}`}
      className="flex gap-4 rounded-2xl p-2 transition hover:bg-gray-50"
    >
      <img
        src={event.image_url}
        alt={event.title}
        className="h-20 w-20 shrink-0 rounded-xl object-cover"
      />

      <div className="min-w-0">
        <span className="rounded bg-black px-2 py-1 text-xs font-bold text-white">
          EVENT
        </span>

        <h4 className="mt-2 line-clamp-2 font-semibold text-gray-900">
          {event.title}
        </h4>

        <p className="truncate text-sm text-gray-500">
          {event.event_date} · {event.venue}
        </p>
      </div>
    </Link>
  );
}

function SimpleResult({
  label,
  title,
  subtitle,
  href,
  onClick,
}: {
  label: "ARTIST" | "VENUE" | "CITY";
  title: string;
  subtitle: string;
  href: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex gap-4 rounded-2xl p-2 transition hover:bg-gray-50"
    >
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-2xl text-white">
        {label === "ARTIST" && "🎤"}
        {label === "VENUE" && "🏢"}
        {label === "CITY" && "📍"}
      </div>

      <div className="min-w-0">
        <span className="rounded bg-black px-2 py-1 text-xs font-bold text-white">
          {label}
        </span>

        <h4 className="mt-2 truncate font-semibold text-gray-900">{title}</h4>
        <p className="truncate text-sm text-gray-500">{subtitle}</p>
      </div>
    </Link>
  );
}

function EmptyResult({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 p-5 text-sm text-gray-500">
      {text}
    </div>
  );
}