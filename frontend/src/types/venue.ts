import type { Event } from "@/types/event";

export type Venue = {
  id: number;
  name: string;
  slug: string;
  city: string;
  address: string;
  image_url: string;
};

export type VenueDetail = Venue & {
  events: Event[];
};
