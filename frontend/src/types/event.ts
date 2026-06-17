import type { Artist } from "@/types/artist";
import type { Genre } from "@/types/genre";
import type { AustralianState } from "@/types/location";
import type { Venue } from "@/types/venue";

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
  genre: Genre;
  city: string;
  state: AustralianState;
  
  venue: Venue;

  artist: Artist;
  lineup: Artist[];

  image_url: string;
  youtube_embed_url?: string | null;
  status: string;
  ticket_links: TicketLink[];
};
