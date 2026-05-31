import Link from "next/link";
import { fetchEventBySlug } from "@/lib/api";
import type { Event } from "@/types/event";

type EventDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { slug } = await params;
  const event: Event = await fetchEventBySlug(slug);

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-black px-6 py-16 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.4fr_0.8fr] md:items-center">
          <div>
            <Link href="/" className="text-sm text-gray-300 hover:text-white">
              ← Back to events
            </Link>

            <p className="mt-8 text-sm uppercase tracking-widest text-gray-400">
              {event.event_type}
            </p>

            <h1 className="mt-3 text-4xl font-bold md:text-6xl">
              {event.title}
            </h1>

            <div className="mt-6 space-y-2 text-lg text-gray-200">
              <p>
                {event.event_date} · {event.event_time}
              </p>
              <p>
                {event.venue} · {event.city}
              </p>
            </div>
          </div>

          <img
            src={event.image_url}
            alt={event.title}
            className="h-72 w-full rounded-3xl object-cover shadow-lg"
          />
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-8">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">Line-up</h2>

            <div className="mt-4 space-y-3">
              {event.lineup.map((artist) => (
                <div
                  key={artist}
                  className="rounded-xl border border-gray-100 p-4"
                >
                  <p className="font-medium text-gray-900">{artist}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">Venue</h2>

            <p className="mt-4 text-gray-700">{event.venue}</p>
            <p className="text-gray-500">{event.city}, Australia</p>
          </div>
        </div>

        <aside className="h-fit rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">Buy tickets</h2>

          <div className="mt-5 space-y-3">
            {event.ticket_links.map((link) => (
              <a
                key={link.provider}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-gray-200 p-4 transition hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium text-gray-900">{link.provider}</p>
                  <p className="text-sm text-gray-500">
                    Opens external ticket site
                  </p>
                </div>

                <span className="text-xl">→</span>
              </a>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}