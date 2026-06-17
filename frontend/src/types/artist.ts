import type { Event } from "@/types/event";
import type { Genre } from "@/types/genre";

export type Artist = {
  id: number;
  name: string;
  slug: string;
  image_url: string;
  genre: Genre;
};

export type ArtistDetail = Artist & {
  events: Event[];
};
