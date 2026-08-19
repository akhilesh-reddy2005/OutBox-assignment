import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

export function DateTimePicker({ value, onChange, error }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Parse current datetime-local value (YYYY-MM-DDTHH:MM)
  const parseLocalString = (str: string): Date => {
    if (!str) return new Date();
    const parsed = new Date(str);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const selectedDate = parseLocalString(value);

  // Month and year to view in calendar grid (tempState)
  const [viewDate, setViewDate] = useState(() => new Date(selectedDate));

  // Sync viewDate when popover opens or value changes
  useEffect(() => {
    setViewDate(new Date(selectedDate));
  }, [value, isOpen]);

  // Compute popup position using fixed coordinates from trigger button
  const openPopup = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popupHeight = 310; // approximate height
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    let top: number;
    if (spaceBelow >= popupHeight || spaceBelow >= spaceAbove) {
      // Position below
      top = rect.bottom + 6;
    } else {
      // Position above
      top = rect.top - popupHeight - 6;
    }

    // Align right edge of popup with right edge of trigger, clamped to viewport
    const popupWidth = 370;
    let left = rect.right - popupWidth;
    if (left < 8) left = 8;

    setPopupStyle({ position: "fixed", top, left, width: popupWidth, zIndex: 9999 });
    setIsOpen(true);
  };

  // Click outside listener to close popover
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popupRef.current && !popupRef.current.contains(target) &&
        triggerRef.current && !triggerRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const formatDateTime = (date: Date) => {
    const year = date.getFullYear();
    const month = MONTHS[date.getMonth()].slice(0, 3);
    const day = date.getDate();

    let hours = date.getHours();
    const period = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${day} ${month} ${year} · ${hours}:${minutes} ${period}`;
  };

  const toDatetimeLocalValue = (date: Date): string => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  // Month navigation helpers
  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  // Day Grid math
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getStartDayOfWeek = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getStartDayOfWeek(year, month);

  // Time components
  let currentHours = selectedDate.getHours();
  const currentPeriod = currentHours >= 12 ? "PM" : "AM";
  currentHours = currentHours % 12;
  currentHours = currentHours ? currentHours : 12;
  const currentHourStr = String(currentHours).padStart(2, "0");
  const currentMinStr = String(selectedDate.getMinutes()).padStart(2, "0");

  const updateDateTime = (updates: {
    year?: number;
    month?: number;
    day?: number;
    hour?: number;
    minute?: number;
    period?: "AM" | "PM";
  }) => {
    const updated = new Date(selectedDate);

    if (updates.year !== undefined) updated.setFullYear(updates.year);
    if (updates.month !== undefined) updated.setMonth(updates.month);
    if (updates.day !== undefined) updated.setDate(updates.day);

    let nextHour = updates.hour !== undefined ? updates.hour : currentHours;
    const nextPeriod = updates.period !== undefined ? updates.period : currentPeriod;

    if (nextPeriod === "PM" && nextHour < 12) nextHour += 12;
    if (nextPeriod === "AM" && nextHour === 12) nextHour = 0;

    updated.setHours(nextHour);

    if (updates.minute !== undefined) {
      updated.setMinutes(updates.minute);
    }

    onChange(toDatetimeLocalValue(updated));
  };

  // Preset selectors
  const setToday = () => {
    const today = new Date();
    today.setSeconds(0, 0);
    updateDateTime({
      year: today.getFullYear(),
      month: today.getMonth(),
      day: today.getDate(),
      hour: today.getHours() % 12 || 12,
      minute: today.getMinutes(),
      period: today.getHours() >= 12 ? "PM" : "AM",
    });
  };

  const clearDateTime = () => {
    onChange(toDatetimeLocalValue(new Date()));
  };

  const popup = isOpen ? (
    <div
      ref={popupRef}
      style={popupStyle}
      className="bg-bg-surface border border-border-main p-4 rounded-xl shadow-2xl flex flex-row gap-4 animate-slide-in font-sans"
    >
      {/* Calendar Grid Section */}
      <div className="flex-1 min-w-0">
        {/* Header controls */}
        <div className="flex items-center justify-between gap-1 mb-3">
          <span className="text-xs font-black text-text-main">
            {MONTHS[month]}, {year}
          </span>
          <div className="flex gap-0.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded hover:bg-bg-elevated border border-transparent hover:border-border-main text-text-muted hover:text-text-main cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded hover:bg-bg-elevated border border-transparent hover:border-border-main text-text-muted hover:text-text-main cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Weekdays Labels */}
        <div className="grid grid-cols-7 text-center text-[10px] font-black text-text-muted/50 uppercase tracking-wider mb-1.5">
          {WEEKDAYS.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        {/* Day grid mapping */}
        <div className="grid grid-cols-7 text-center gap-y-1 gap-x-0.5 text-xs font-bold text-text-main">
          {Array.from({ length: startDay }).map((_, idx) => (
            <div key={`offset-${idx}`} className="h-7 w-7" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const isSelected =
              selectedDate.getDate() === dayNum &&
              selectedDate.getMonth() === month &&
              selectedDate.getFullYear() === year;

            return (
              <button
                key={`day-${dayNum}`}
                type="button"
                onClick={() => updateDateTime({ day: dayNum, month, year })}
                className={`h-7 w-7 flex items-center justify-center rounded-lg border text-[11px] font-black cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-accent border-accent text-white dark:text-[#0B0F14]"
                    : "bg-transparent border-transparent hover:bg-bg-elevated hover:text-text-main"
                }`}
              >
                {dayNum}
              </button>
            );
          })}
        </div>

        {/* Presets footer */}
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-border-main/50 text-[10px] font-black select-none">
          <button
            type="button"
            onClick={clearDateTime}
            className="text-text-muted hover:text-err transition-colors cursor-pointer"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={setToday}
            className="text-accent hover:opacity-80 transition-opacity cursor-pointer"
          >
            Today
          </button>
        </div>
      </div>

      {/* Time Picker Columns Section */}
      <div className="w-[88px] flex gap-1 border-l border-border-main/60 pl-3 shrink-0">
        {/* Hour select column */}
        <div className="flex-1 flex flex-col items-center overflow-y-auto max-h-[200px] scrollbar-none">
          <div className="text-[8px] font-black text-text-muted/40 uppercase tracking-widest mb-1 sticky top-0 bg-bg-surface py-0.5 select-none">Hr</div>
          {HOURS.map((hr) => {
            const isSelected = hr === currentHourStr;
            return (
              <button
                key={`hr-${hr}`}
                type="button"
                onClick={() => updateDateTime({ hour: Number(hr) })}
                className={`w-full py-1 text-[11px] font-black rounded-md cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-accent text-white dark:text-[#0B0F14]"
                    : "text-text-muted hover:bg-bg-elevated hover:text-text-main"
                }`}
              >
                {hr}
              </button>
            );
          })}
        </div>

        {/* Minute select column */}
        <div className="flex-1 flex flex-col items-center overflow-y-auto max-h-[200px] scrollbar-none">
          <div className="text-[8px] font-black text-text-muted/40 uppercase tracking-widest mb-1 sticky top-0 bg-bg-surface py-0.5 select-none">Min</div>
          {MINUTES.map((mn) => {
            const isSelected = mn === currentMinStr;
            return (
              <button
                key={`mn-${mn}`}
                type="button"
                onClick={() => updateDateTime({ minute: Number(mn) })}
                className={`w-full py-1 text-[11px] font-black rounded-md cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-accent text-white dark:text-[#0B0F14]"
                    : "text-text-muted hover:bg-bg-elevated hover:text-text-main"
                }`}
              >
                {mn}
              </button>
            );
          })}
        </div>

        {/* Period select column */}
        <div className="flex flex-col gap-1 w-7 shrink-0">
          <div className="text-[8px] font-black text-text-muted/40 uppercase tracking-widest mb-1 text-center select-none">AP</div>
          {(["AM", "PM"] as const).map((period) => {
            const isSelected = period === currentPeriod;
            return (
              <button
                key={`period-${period}`}
                type="button"
                onClick={() => updateDateTime({ period })}
                className={`w-full py-1 text-[10px] font-black rounded-md cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-accent text-white dark:text-[#0B0F14]"
                    : "text-text-muted hover:bg-bg-elevated hover:text-text-main"
                }`}
              >
                {period}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="w-full font-sans select-none text-left">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => isOpen ? setIsOpen(false) : openPopup()}
        className={`w-full h-10 px-3.5 rounded-lg border border-border-main bg-bg-surface text-sm text-text-main font-bold flex items-center justify-between transition-all focus:border-accent focus:outline-none cursor-pointer ${
          error ? "border-err" : ""
        }`}
      >
        <span>{formatDateTime(selectedDate)}</span>
        <CalendarIcon className="h-4.5 w-4.5 text-text-muted/60 shrink-0" />
      </button>

      {typeof document !== "undefined" && createPortal(popup, document.body)}

      {error && <p className="text-[11px] font-bold text-err mt-0.5">{error}</p>}
    </div>
  );
}
