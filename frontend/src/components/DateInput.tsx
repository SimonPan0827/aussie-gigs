"use client";

import { useState } from "react";
import Link from "next/link";

type DateInputProps = {
  name: string;
  value: string;
  clearHref: string;
};

export default function DateInput({ name, value, clearHref }: DateInputProps) {
  const [currentValue, setCurrentValue] = useState(value);

  return (
    <div className="relative flex min-w-0 flex-1 items-center rounded-full bg-white px-4 py-3">
      {!currentValue && (
        <span className="pointer-events-none absolute left-4 text-sm text-gray-500">
          Select date
        </span>
      )}

      <input
        type="date"
        name={name}
        value={currentValue}
        onChange={(event) => setCurrentValue(event.target.value)}
        className={`min-w-0 flex-1 bg-transparent text-sm outline-none ${
          currentValue ? "text-black" : "text-transparent"
        }`}
      />

      {currentValue && (
        <Link
          href={clearHref}
          onClick={() => setCurrentValue("")}
          className="ml-2 shrink-0 text-sm font-semibold text-gray-500 hover:text-black"
        >
          ×
        </Link>
      )}
    </div>
  );
}