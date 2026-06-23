"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AU_STATES, type AustralianState } from "@/types/location";
import type { Genre } from "@/types/genre";

type SearchLocationFilterProps = {
  selectedState?: AustralianState;
  selectedCity?: string;
  cityOptionsByState: Record<AustralianState, string[]>;
  q?: string;
  eventType?: string;
  genres: Genre[];
  startDate?: string;
  endDate?: string;
  tab?: string;
};

type DropdownOption = {
  label: string;
  value: string;
};

export default function SearchLocationFilter({
  selectedState,
  selectedCity,
  cityOptionsByState,
  q,
  eventType,
  genres,
  startDate,
  endDate,
  tab,
}: SearchLocationFilterProps) {
  const router = useRouter();
  const [state, setState] = useState<AustralianState | "">(selectedState || "");
  const [city, setCity] = useState(selectedCity || "");
  const [openMenu, setOpenMenu] = useState<"state" | "city" | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const cityOptions = useMemo(
    () => (state ? cityOptionsByState[state] || [] : []),
    [cityOptionsByState, state]
  );

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setOpenMenu(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const stateOptions = useMemo(
    () => [
      { label: "All states", value: "" },
      ...AU_STATES.map((stateOption) => ({
        label: stateOption.code,
        value: stateOption.code,
      })),
    ],
    []
  );

  const cityMenuOptions = useMemo(
    () =>
      state
        ? [
            { label: "All cities", value: "" },
            ...cityOptions.map((cityOption) => ({
              label: cityOption,
              value: cityOption,
            })),
          ]
        : [],
    [cityOptions, state]
  );

  function buildHref(nextState: AustralianState | "", nextCity: string) {
    const searchParams = new URLSearchParams();

    if (q) searchParams.set("q", q);
    if (nextState) searchParams.set("state", nextState);
    if (nextState && nextCity) searchParams.set("city", nextCity);
    if (eventType) searchParams.set("event_type", eventType);
    if (startDate) searchParams.set("start_date", startDate);
    if (endDate) searchParams.set("end_date", endDate);
    if (tab) searchParams.set("tab", tab);

    genres.forEach((genre) => {
      searchParams.append("genre", genre);
    });

    const queryString = searchParams.toString();

    return queryString ? `/search?${queryString}` : "/search";
  }

  function chooseState(nextState: string) {
    const normalizedState = nextState as AustralianState | "";

    setState(normalizedState);
    setCity("");
    setOpenMenu(null);
    router.push(buildHref(normalizedState, ""));
  }

  function chooseCity(nextCity: string) {
    setCity(nextCity);
    setOpenMenu(null);
    router.push(buildHref(state, nextCity));
  }

  return (
    <div
      ref={filterRef}
      className="relative z-30 grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:items-center"
    >
      <DropdownButton
        label="State"
        value={state}
        displayValue={state || "State"}
        isOpen={openMenu === "state"}
        options={stateOptions}
        onToggle={() => setOpenMenu(openMenu === "state" ? null : "state")}
        onSelect={chooseState}
      />

      <DropdownButton
        label="City"
        value={city}
        displayValue={state ? city || "City" : "City"}
        disabled={!state}
        isOpen={openMenu === "city"}
        options={cityMenuOptions}
        onToggle={() => {
          if (state) {
            setOpenMenu(openMenu === "city" ? null : "city");
          }
        }}
        onSelect={chooseCity}
        emptyMessage="No cities available"
      />

      {state && <input type="hidden" name="state" value={state} />}
      {state && city && <input type="hidden" name="city" value={city} />}
    </div>
  );
}

type DropdownButtonProps = {
  label: string;
  value: string;
  displayValue: string;
  disabled?: boolean;
  isOpen: boolean;
  options: DropdownOption[];
  onToggle: () => void;
  onSelect: (value: string) => void;
  emptyMessage?: string;
};

function DropdownButton({
  label,
  value,
  displayValue,
  disabled = false,
  isOpen,
  options,
  onToggle,
  onSelect,
  emptyMessage = "No options available",
}: DropdownButtonProps) {
  return (
    <div className="relative min-w-0">
      <button
        type="button"
        disabled={disabled}
        aria-label={label}
        aria-expanded={isOpen}
        onClick={onToggle}
        className="flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-full border border-gray-200 bg-gray-100 px-4 text-sm font-semibold text-gray-900 transition hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20 disabled:cursor-not-allowed disabled:text-gray-400 sm:min-w-24"
      >
        <span className="max-w-28 truncate">{displayValue}</span>
        <span
          className={`text-base leading-none text-gray-600 transition ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        >
          ⌄
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-40 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gray-200 bg-white py-2 text-black shadow-2xl ring-1 ring-black/10">
          {options.length > 0 ? (
            <div className="max-h-80 overflow-y-auto px-2" role="listbox">
              {options.map((option) => {
                const isSelected = option.value === value;

                return (
                  <button
                    key={`${label}-${option.value || "all"}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => onSelect(option.value)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-base font-medium transition ${
                      isSelected
                        ? "bg-blue-500 text-white"
                        : "text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    <span className="w-4 text-lg leading-none">
                      {isSelected ? "✓" : ""}
                    </span>
                    <span className="truncate">{option.label}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="px-5 py-4 text-sm font-medium text-gray-500">
              {emptyMessage}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
