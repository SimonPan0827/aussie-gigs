import type { Event } from "@/types/event";
import type { AustralianState } from "@/types/location";

export type Venue = {
  id: number;
  name: string;
  slug: string;
  city: string;
  state: AustralianState;
  address: string;
  image_url: string | null;
};

export type VenueDetail = Venue & {
  events: Event[];
};
