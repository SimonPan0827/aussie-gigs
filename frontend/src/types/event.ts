import type { Artist } from "@/types/artist";

export type TicketLink = {
  provider: string;
  url: string;
  is_primary: boolean;
};

export type Event = {
  id: number;
  title: string;
  slug: string;
  event_date: string;
  event_time: string;
  event_type: string;
  genre: string;
  city: string;
  venue: string;

  artist: Artist;
  lineup: Artist[];

  image_url: string;
  youtube_embed_url?: string | null;
  status: string;
  ticket_links: TicketLink[];
};