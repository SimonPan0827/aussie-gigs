import EventCard from "@/components/EventCard";
import Navbar from "@/components/Navbar";
import { fetchEventsPage } from "@/lib/api";
import type { Event } from "@/types/event";
import Link from "next/link";

function getTodayDateString() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Melbourne",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(new Date());
}

export default async function HomePage() {
  const eventsPage = await fetchEventsPage({
    start_date: getTodayDateString(),
    page: 1,
    per_page: 10,
  });
  const featuredEvents: Event[] = eventsPage.items;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <Navbar events={featuredEvents} />

      {/* Hero section */}
      <section className="relative overflow-hidden bg-black px-6 pb-16 pt-10 text-white sm:pb-20 sm:pt-12">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-45"
          style={{
            backgroundImage: "url('/mainpage.jpeg')",
          }}
        />

        {/* Dark overlay to keep text readable */}
        <div className="absolute inset-0 bg-black/55" />

        {/* Hero content */}
        <div className="relative z-10 mx-auto max-w-6xl">
          <p className="text-xs uppercase tracking-widest text-gray-300 sm:text-sm">
            Live music in Australia
          </p>

          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
            Discover upcoming concerts, gigs and festivals across Australia.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-gray-200 sm:mt-6 sm:text-lg">
            Search live music events by city, artist and venue, then jump directly to
            official ticket links.
          </p>
        </div>
      </section>

      {/* 4 Type Block */}
      <section className="mx-auto max-w-6xl px-6 py-9 sm:py-10">
        <h2 className="mb-5 text-xl font-semibold text-gray-900 sm:text-2xl">
          Browse by event type
        </h2>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Link
            href="/search?event_type=concert"
            className="rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:p-6"
          >
            <p className="text-2xl sm:text-3xl">🎤</p>
            <h3 className="mt-3 text-base font-semibold text-gray-900 sm:mt-4 sm:text-xl">
              Concert
            </h3>
            <p className="mt-2 text-xs leading-5 text-gray-500 sm:text-sm">
              Live shows from local and international artists.
            </p>
          </Link>

          <Link
            href="/search?event_type=festival"
            className="rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:p-6"
          >
            <p className="text-2xl sm:text-3xl">🎪</p>
            <h3 className="mt-3 text-base font-semibold text-gray-900 sm:mt-4 sm:text-xl">
              Festival
            </h3>
            <p className="mt-2 text-xs leading-5 text-gray-500 sm:text-sm">
              Multi-stage music festivals across Australia.
            </p>
          </Link>

          <Link
            href="/search?event_type=dj-set"
            className="rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:p-6"
          >
            <p className="text-2xl sm:text-3xl">🎧</p>
            <h3 className="mt-3 text-base font-semibold text-gray-900 sm:mt-4 sm:text-xl">
              DJ Set
            </h3>
            <p className="mt-2 text-xs leading-5 text-gray-500 sm:text-sm">
              Electronic, club and late-night DJ events.
            </p>
          </Link>

          <Link
            href="/search"
            className="group relative flex min-h-40 overflow-hidden rounded-2xl border border-black bg-black p-4 text-white shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:min-h-56 sm:p-6"
          >
            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-16 left-8 h-28 w-28 rounded-full bg-white/5" />

            <div className="relative z-10 flex w-full flex-col justify-between">
              <div>
                <span className="inline-flex rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-200 sm:px-3 sm:text-xs">
                  All events
                </span>

                <h3 className="mt-4 text-lg font-semibold sm:mt-5 sm:text-2xl">All gigs</h3>
                <p className="mt-2 max-w-52 text-xs leading-5 text-gray-300 sm:text-sm sm:leading-6">
                  Explore every upcoming gig across Australia.
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between sm:mt-6">
                <span className="text-xs font-medium text-gray-400 sm:text-sm">
                  Browse all
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-xl text-black transition group-hover:translate-x-1 sm:h-11 sm:w-11 sm:text-2xl">
                  →
                </span>
              </div>
            </div>
          </Link>
        </div>

        <Link
          href="#spotify-connect"
          className="mt-5 flex items-center justify-between rounded-2xl border border-[#1DB954]/40 bg-[#1DB954]/10 px-8 py-5 shadow-sm transition hover:-translate-y-1 hover:bg-[#1DB954]/15 hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1DB954] text-white"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 16 16"
                className="h-7 w-7"
                fill="currentColor"
              >
                <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0m3.669 11.538a.5.5 0 0 1-.686.165c-1.879-1.147-4.243-1.407-7.028-.77a.499.499 0 0 1-.222-.973c3.048-.696 5.662-.397 7.77.892a.5.5 0 0 1 .166.686m.979-2.178a.624.624 0 0 1-.858.205c-2.15-1.321-5.428-1.704-7.972-.932a.625.625 0 0 1-.362-1.194c2.905-.881 6.517-.454 8.986 1.063a.624.624 0 0 1 .206.858m.084-2.268C10.154 5.56 5.9 5.419 3.438 6.166a.748.748 0 1 1-.434-1.432c2.825-.857 7.523-.692 10.492 1.07a.747.747 0 1 1-.764 1.288" />
              </svg>
            </span>

            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Personalized gigs
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Connect Spotify to see gigs from artists you listen to.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-[#1DB954] px-4 py-2 text-sm font-semibold text-white sm:inline-flex">
              Connect Spotify
            </span>
            <span className="text-2xl text-gray-500">→</span>
          </div>
        </Link>
      </section>

      {/* Upcoming section */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="mb-6 text-2xl font-semibold">Upcoming events</h2>

        <div className="grid grid-cols-2 gap-3 sm:gap-6">
          {featuredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        {eventsPage.total > featuredEvents.length && (
          <div className="mt-8 flex justify-center">
            <Link
              href="/search"
              className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Browse all
            </Link>
          </div>
        )}
      </section>

      <footer className="border-t bg-white px-6 py-6 text-center text-sm text-gray-500">
        © 2026 AussieGigsSimonPan. All rights reserved.
      </footer>
    </main>
  );
}
