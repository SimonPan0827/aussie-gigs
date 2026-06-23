import Link from "next/link";
import SearchModal from "@/components/SearchModal";
import type { Event } from "@/types/event";

type NavbarProps = {
  events: Event[];
};

export default function Navbar({ events }: NavbarProps) {
  return (
    <nav className="bg-black px-4 py-4 text-white sm:px-6 sm:py-5">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <Link href="/" className="shrink-0 text-xl font-bold tracking-tight">
          Aussie Gigs
        </Link>

        <div className="min-w-0">
          <SearchModal events={events} />
        </div>
      </div>
    </nav>
  );
}
