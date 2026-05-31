import Link from "next/link";
import type { Event } from "@/types/event";

type EventCardProps = {
  event: Event;
  isPast?: boolean;
};

export default function EventCard({ event, isPast = false }: EventCardProps) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md ${
        isPast ? "border-gray-200 bg-gray-50 opacity-75" : ""
      }`}
    >
      <img
        src={event.image_url}
        alt={event.title}
        className={`h-48 w-full object-cover ${isPast ? "grayscale" : ""}`}
      />

      <div className="space-y-4 p-5">
        <div>
          {isPast && (
            <span className="mb-2 inline-flex rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-600">
              Past event
            </span>
          )}

          <p className="text-sm text-gray-500">
            {event.event_date} · {event.city}
          </p>

          <h2 className="mt-1 text-xl font-semibold text-gray-900">
            {event.title}
          </h2>

          <p className="mt-1 text-gray-600">{event.venue}</p>
        </div>

        <Link
          href={`/events/${event.slug}`}
          className={`inline-flex rounded-full px-5 py-2 text-sm font-medium transition ${
            isPast
              ? "bg-gray-300 text-gray-700 hover:bg-gray-400"
              : "bg-black text-white hover:bg-gray-800"
          }`}
        >
          {isPast ? "View details" : "Buy tickets"}
        </Link>
      </div>
    </div>
  );
}