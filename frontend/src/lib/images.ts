export const FALLBACK_EVENT_IMAGE =
  "https://images.unsplash.com/photo-1501386761578-eac5c94b800a";

export const FALLBACK_ARTIST_IMAGE =
  "https://images.unsplash.com/photo-1516280440614-37939bbacd81";

export const FALLBACK_VENUE_IMAGE =
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30";

export function imageOrFallback(
  imageUrl: string | null | undefined,
  fallbackUrl: string,
) {
  return imageUrl || fallbackUrl;
}
