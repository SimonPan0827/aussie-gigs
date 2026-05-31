const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type FetchEventsParams = {
  q?: string;
  city?: string;
  event_type?: string;
  genre?: string;
};

export async function fetchEvents(params?: FetchEventsParams) {
  const searchParams = new URLSearchParams();

  if (params?.q) {
    searchParams.set("q", params.q);
  }

  if (params?.city) {
    searchParams.set("city", params.city);
  }

  if (params?.event_type) {
    searchParams.set("event_type", params.event_type);
  }

  if (params?.genre) {
    searchParams.set("genre", params.genre);
  }

  const queryString = searchParams.toString();

  const url = queryString
    ? `${API_BASE_URL}/events?${queryString}`
    : `${API_BASE_URL}/events`;

  const res = await fetch(url, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch events");
  }

  return res.json();
}

export async function fetchEventBySlug(slug: string) {
  const res = await fetch(`${API_BASE_URL}/events/${slug}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch event");
  }

  return res.json();
}