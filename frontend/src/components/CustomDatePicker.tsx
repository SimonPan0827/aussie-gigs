"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type CustomDatePickerProps = {
  name: string;
  value: string;
  clearHref: string;
  minDate?: string;
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function toDateString(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function getTodayString() {
  const today = new Date();
  return toDateString(today.getFullYear(), today.getMonth(), today.getDate());
}

function parseDateString(value: string) {
  if (!value) return null;

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) return null;

  return {
    year,
    month: month - 1,
    day,
  };
}

function formatDisplayDate(value: string) {
  const parsed = parseDateString(value);

  if (!parsed) return "Select date";

  return `${pad(parsed.day)}/${pad(parsed.month + 1)}/${parsed.year}`;
}

export default function CustomDatePicker({
  name,
  value,
  clearHref,
  minDate,
}: CustomDatePickerProps) {
  const todayString = getTodayString();
  const minimumDate = minDate || todayString;

  const selectedDate = parseDateString(value);
  const minParsed = parseDateString(minimumDate);

  const [currentValue, setCurrentValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [visibleYear, setVisibleYear] = useState(
    selectedDate?.year || minParsed?.year || new Date().getFullYear()
  );
  const [visibleMonth, setVisibleMonth] = useState(
    selectedDate?.month ?? minParsed?.month ?? new Date().getMonth()
  );

  const years = useMemo(() => {
    const startYear = minParsed?.year || new Date().getFullYear();
    const endYear = startYear + 5;

    return Array.from(
      { length: endYear - startYear + 1 },
      (_, index) => startYear + index
    );
  }, [minParsed?.year]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(visibleYear, visibleMonth, 1);
    const firstWeekday = firstDay.getDay();
    const daysInMonth = new Date(visibleYear, visibleMonth + 1, 0).getDate();

    const emptyDays = Array.from({ length: firstWeekday }, () => null);

    const monthDays = Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const dateString = toDateString(visibleYear, visibleMonth, day);

      return {
        day,
        dateString,
        disabled: dateString < minimumDate,
      };
    });

    return [...emptyDays, ...monthDays];
  }, [visibleYear, visibleMonth, minimumDate]);

  function handleSelectDate(dateString: string) {
    if (dateString < minimumDate) return;

    setCurrentValue(dateString);
    setIsOpen(false);
  }

  return (
    <div className="relative min-w-0 flex-1">
      <input type="hidden" name={name} value={currentValue} />

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between rounded-full bg-white px-5 py-3 text-left text-sm shadow-sm"
      >
        <span className={currentValue ? "text-black" : "text-gray-500"}>
          {formatDisplayDate(currentValue)}
        </span>

        <span className="text-gray-400">▾</span>
      </button>

      {currentValue && (
        <Link
          href={clearHref}
          onClick={() => setCurrentValue("")}
          className="absolute right-10 top-1/2 z-10 -translate-y-1/2 text-sm font-semibold text-gray-500 hover:text-black"
        >
          ×
        </Link>
      )}

      {isOpen && (
        <div className="absolute left-0 top-full z-[9999] mt-3 w-80 rounded-3xl border border-gray-200 bg-white p-4 text-black shadow-2xl">
          <div className="mb-4 flex gap-2">
            <select
              value={visibleMonth}
              onChange={(event) => setVisibleMonth(Number(event.target.value))}
              className="min-w-0 flex-1 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm text-black outline-none"
            >
              {MONTHS.map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </select>

            <select
              value={visibleYear}
              onChange={(event) => setVisibleYear(Number(event.target.value))}
              className="w-28 shrink-0 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm text-black outline-none"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div
            className="grid gap-1 text-center text-xs font-semibold text-gray-400"
            style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}
          >
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          <div
            className="mt-1 grid gap-1"
            style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}
          >
            {calendarDays.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="h-10" />;
              }

              const isSelected = date.dateString === currentValue;

              return (
                <button
                  key={date.dateString}
                  type="button"
                  disabled={date.disabled}
                  onClick={() => handleSelectDate(date.dateString)}
                  className={`flex h-10 items-center justify-center rounded-full text-sm transition ${
                    isSelected
                      ? "bg-black text-white"
                      : date.disabled
                        ? "cursor-not-allowed text-gray-300"
                        : "text-gray-800 hover:bg-gray-100"
                  }`}
                >
                  {date.day}
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-xs text-gray-400">
            Dates before today are not available.
          </p>
        </div>
      )}
    </div>
  );
}