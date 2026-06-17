import Link from "next/link";
import EventCard from "@/components/EventCard";
import Navbar from "@/components/Navbar";
import { fetchEvents, fetchVenueBySlug } from "@/lib/api";
import type { Event } from "@/types/event";
import type { VenueDetail } from "@/types/venue";

type VenueDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function getTodayDateString() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Melbourne",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(new Date());
}

export default async function VenueDetailPage({
  params,
}: VenueDetailPageProps) {
  const { slug } = await params;

  const venue: VenueDetail = await fetchVenueBySlug(slug);
  const allEventsForNavbar: Event[] = await fetchEvents();

  const today = getTodayDateString();

  const sortedEvents = [...venue.events].sort((a, b) => {
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

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar events={allEventsForNavbar} />

      <section className="bg-black px-6 py-16 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <img
            src={venue.image_url}
            alt={venue.name}
            className="h-80 w-full rounded-3xl object-cover shadow-lg"
          />

          <div>
            <Link href="/search?tab=venues" className="text-sm text-gray-300 hover:text-white">
              ← Back to venues
            </Link>

            <p className="mt-8 text-sm font-semibold uppercase tracking-widest text-gray-400">
              Venue
            </p>

            <h1 className="mt-3 text-5xl font-bold">
              {venue.name}
            </h1>

            <p className="mt-5 text-lg text-gray-200">
              {venue.address}
            </p>

            <p className="mt-2 text-gray-400">
              {venue.city}, Australia
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900">
            Upcoming events
          </h2>

          <p className="mt-1 text-gray-500">
            {upcomingEvents.length} upcoming event
            {upcomingEvents.length === 1 ? "" : "s"} found
          </p>
        </div>

        {upcomingEvents.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">
              No upcoming events
            </h3>
            <p className="mt-2 text-gray-500">
              Check back later for new events at this venue.
            </p>
          </div>
        )}

        {pastEvents.length > 0 && (
          <div className="mt-14">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900">
                Past events
              </h2>

              <p className="mt-1 text-gray-500">
                {pastEvents.length} past event
                {pastEvents.length === 1 ? "" : "s"} found
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {pastEvents.map((event) => (
                <EventCard key={event.id} event={event} isPast />
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
