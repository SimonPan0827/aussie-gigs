"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement | null>(null);

  const todayString = getTodayString();
  const minimumDate = minDate || todayString;

  const selectedDate = parseDateString(value);
  const minimumParsedDate = parseDateString(minimumDate);

  const [currentValue, setCurrentValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });

  const [visibleYear, setVisibleYear] = useState(
    selectedDate?.year || minimumParsedDate?.year || new Date().getFullYear()
  );

  const [visibleMonth, setVisibleMonth] = useState(
    selectedDate?.month ?? minimumParsedDate?.month ?? new Date().getMonth()
  );

  const years = useMemo(() => {
    const startYear = minimumParsedDate?.year || new Date().getFullYear();
    const endYear = startYear + 5;

    return Array.from(
      { length: endYear - startYear + 1 },
      (_, index) => startYear + index
    );
  }, [minimumParsedDate?.year]);

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(visibleYear, visibleMonth, 1);
    const firstWeekday = firstDayOfMonth.getDay();
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

  function openCalendar() {
    const rect = buttonRef.current?.getBoundingClientRect();

    if (rect) {
      setPopupPosition({
        top: rect.bottom + 12,
        left: rect.left,
      });
    }

    setIsOpen((current) => !current);
  }

  function handleSelectDate(dateString: string) {
    if (dateString < minimumDate) return;

    setCurrentValue(dateString);
    setIsOpen(false);
  }

  function handleClearDate(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();

    setCurrentValue("");
    setIsOpen(false);
    router.push(clearHref);
  }

  return (
    <div className="min-w-0 flex-1">
      <input type="hidden" name={name} value={currentValue} />

      <div
        ref={buttonRef}
        className="flex w-full items-center rounded-full bg-white px-5 py-3 text-sm shadow-sm"
      >
        <button
          type="button"
          onClick={openCalendar}
          className="min-w-0 flex-1 text-left outline-none"
        >
          <span className={currentValue ? "text-black" : "text-gray-500"}>
            {formatDisplayDate(currentValue)}
          </span>
        </button>

        {currentValue && (
          <button
            type="button"
            onClick={handleClearDate}
            className="ml-3 shrink-0 text-sm font-semibold text-gray-500 hover:text-black"
            aria-label="Clear date"
          >
            ×
          </button>
        )}

        <button
          type="button"
          onClick={openCalendar}
          className="ml-3 shrink-0 text-gray-400"
          aria-label="Open calendar"
        >
          ▾
        </button>
      </div>

      {isOpen && (
        <>
          <button
            type="button"
            aria-label="Close calendar"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[9998] cursor-default bg-transparent"
          />

          <div
            className="fixed z-[9999] w-80 max-w-[calc(100vw-2rem)] rounded-3xl border border-gray-200 bg-white p-4 text-black shadow-2xl"
            style={{
              top: popupPosition.top,
              left: popupPosition.left,
            }}
          >
            <div className="mb-4 flex gap-2">
              <select
                value={visibleMonth}
                onChange={(event) =>
                  setVisibleMonth(Number(event.target.value))
                }
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
              {WEEKDAYS.map((weekday) => (
                <div key={weekday} className="py-1">
                  {weekday}
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
        </>
      )}
    </div>
  );
}