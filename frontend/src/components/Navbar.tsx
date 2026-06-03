import Link from "next/link";
import SearchModal from "@/components/SearchModal";
import type { Event } from "@/types/event";

type NavbarProps = {
  events: Event[];
};

export default function Navbar({ events }: NavbarProps) {
  return (
    <nav className="bg-black px-6 py-5 text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Aussie Gigs
        </Link>

        <div className="flex items-center gap-4">
          <SearchModal events={events} />
        </div>
      </div>
    </nav>
  );
}