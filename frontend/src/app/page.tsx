import EventCard from "@/components/EventCard";
import Navbar from "@/components/Navbar";
import { fetchEvents } from "@/lib/api";
import type { Event } from "@/types/event";
import Link from "next/link";

export default async function HomePage() {
  const events: Event[] = await fetchEvents();
  const featuredEvents = events.slice(0, 10);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <Navbar events={events} />

      {/* Hero section */}
      <section className="relative overflow-hidden bg-black px-6 pb-20 pt-12 text-white">
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
          <p className="text-sm uppercase tracking-widest text-gray-300">
            Live music in Australia
          </p>

          <h1 className="mt-4 max-w-3xl text-5xl font-bold">
            Discover upcoming concerts, gigs and festivals across Australia.
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-gray-200">
            Search live music events by city, artist and venue, then jump directly to
            official ticket links.
          </p>
        </div>
      </section>

      {/* 4 Type Block */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <h2 className="mb-5 text-2xl font-semibold text-gray-900">
          Browse by event type
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/search?event_type=concert"
            className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <p className="text-3xl">🎤</p>
            <h3 className="mt-4 text-xl font-semibold text-gray-900">
              Concert
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Live shows from local and international artists.
            </p>
          </Link>

          <Link
            href="/search?event_type=festival"
            className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <p className="text-3xl">🎪</p>
            <h3 className="mt-4 text-xl font-semibold text-gray-900">
              Festival
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Multi-stage music festivals across Australia.
            </p>
          </Link>

          <Link
            href="/search?event_type=dj-set"
            className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <p className="text-3xl">🎧</p>
            <h3 className="mt-4 text-xl font-semibold text-gray-900">
              DJ Set
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Electronic, club and late-night DJ events.
            </p>
          </Link>

          <Link
            href="/search?event_type=party-night"
            className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <p className="text-3xl">🪩</p>
            <h3 className="mt-4 text-xl font-semibold text-gray-900">
              Party Night
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Dance floors, themed nights and underground parties.
            </p>
          </Link>
        </div>

        <Link
          href="/search"
          className="mt-5 flex items-center justify-between rounded-2xl border bg-white px-8 py-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <span className="text-3xl">🎵</span>

            <div>
              <h3 className="text-xl font-semibold text-gray-900">All gigs</h3>
              <p className="mt-1 text-sm text-gray-500">
                Browse all upcoming concerts, festivals, DJ sets and party nights.
              </p>
            </div>
          </div>

          <span className="text-2xl text-gray-500">→</span>
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

        {events.length > featuredEvents.length && (
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
