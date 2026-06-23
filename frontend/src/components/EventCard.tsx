import Link from "next/link";
import { FALLBACK_EVENT_IMAGE, imageOrFallback } from "@/lib/images";
import type { Event } from "@/types/event";

type EventCardProps = {
  event: Event;
  isPast?: boolean;
  returnHref?: string;
};

export default function EventCard({
  event,
  isPast = false,
  returnHref,
}: EventCardProps) {
  const eventHref = returnHref
    ? `/events/${event.slug}?return_to=${encodeURIComponent(returnHref)}`
    : `/events/${event.slug}`;

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:rounded-2xl ${
        isPast ? "border-gray-200 bg-gray-50 opacity-75" : ""
      }`}
    >
      <img
        src={imageOrFallback(event.image_url, FALLBACK_EVENT_IMAGE)}
        alt={event.title}
        className={`h-28 w-full object-cover sm:h-48 ${isPast ? "grayscale" : ""}`}
      />

      <div className="space-y-3 p-3 sm:space-y-4 sm:p-5">
        <div>
          {isPast && (
            <span className="mb-2 inline-flex rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-600 sm:px-3 sm:py-1 sm:text-xs">
              Past event
            </span>
          )}

          <p className="text-xs text-gray-500 sm:text-sm">
            {event.event_date} · {event.city}
          </p>

          <h2 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-gray-900 sm:text-xl">
            {event.title}
          </h2>

          <p className="mt-1 line-clamp-1 text-xs text-gray-600 sm:text-base">
            {event.venue.name}
          </p>
        </div>

        <Link
          href={eventHref}
          className={`inline-flex rounded-full px-3 py-1.5 text-xs font-medium transition sm:px-5 sm:py-2 sm:text-sm ${
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
