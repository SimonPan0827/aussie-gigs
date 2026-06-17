import EventCard from "@/components/EventCard";
import Navbar from "@/components/Navbar";
import { fetchArtistBySlug, fetchEvents } from "@/lib/api";
import type { ArtistDetail } from "@/types/artist";
import type { Event } from "@/types/event";

type ArtistDetailPageProps = {
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

export default async function ArtistDetailPage({
  params,
}: ArtistDetailPageProps) {
  const { slug } = await params;

  const artist: ArtistDetail = await fetchArtistBySlug(slug);
  const allEventsForNavbar: Event[] = await fetchEvents();

  const today = getTodayDateString();

  const sortedEvents = [...artist.events].sort((a, b) => {
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
        <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-center">
          <img
            src={artist.image_url}
            alt={artist.name}
            className="h-32 w-32 rounded-full object-cover ring-4 ring-white/20"
          />

          <div>
            <p className="text-sm uppercase tracking-widest text-gray-400">
              Artist
            </p>

            <h1 className="mt-3 text-5xl font-bold">{artist.name}</h1>

            <p className="mt-4 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-gray-200">
              {artist.genre}
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
              Check back later for new Australian tour dates.
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