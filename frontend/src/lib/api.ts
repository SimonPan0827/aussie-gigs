import type { Genre } from "@/types/genre";
import type { AustralianState } from "@/types/location";
import type { Event } from "@/types/event";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type FetchEventsParams = {
  q?: string;
  state?: AustralianState;
  city?: string;
  event_type?: string;
  genre?: Genre | Genre[];
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: number;
};

export type EventPage<T> = {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
};

export async function fetchEvents(params?: FetchEventsParams) {
  const searchParams = new URLSearchParams();

  if (params?.q) {
    searchParams.set("q", params.q);
  }

  if (params?.state) {
    searchParams.set("state", params.state);
  }

  if (params?.city) {
    searchParams.set("city", params.city);
  }

  if (params?.event_type) {
    searchParams.set("event_type", params.event_type);
  }

  if (params?.genre) {
    if (Array.isArray(params.genre)) {
      params.genre.forEach((genre) => {
        if (genre) searchParams.append("genre", genre);
      });
    } else {
      searchParams.set("genre", params.genre);
    }
  }

  if (params?.start_date) {
    searchParams.set("start_date", params.start_date);
  }

  if (params?.end_date) {
    searchParams.set("end_date", params.end_date);
  }

  if (params?.page) {
    searchParams.set("page", String(params.page));
  }

  if (params?.per_page) {
    searchParams.set("per_page", String(params.per_page));
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

export async function fetchEventsPage(params: FetchEventsParams) {
  const data = await fetchEvents(params);
  return data as EventPage<Event>;
}

export async function fetchEventLocations() {
  const res = await fetch(`${API_BASE_URL}/events/locations`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch event locations");
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

export async function fetchArtistBySlug(slug: string) {
  const res = await fetch(`${API_BASE_URL}/artists/${slug}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch artist");
  }

  return res.json();
}

export async function fetchVenueBySlug(slug: string) {
  const res = await fetch(`${API_BASE_URL}/venues/${slug}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch venue");
  }

  return res.json();
}
