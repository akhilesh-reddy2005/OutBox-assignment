export function formatDate(isoString: string | null): string {
  if (!isoString) return "—";

  const date = new Date(isoString);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDateParts(isoString: string | null): {
  date: string;
  time: string;
} {
  if (!isoString) {
    return { date: "—", time: "" };
  }

  const dateObj = new Date(isoString);

  if (Number.isNaN(dateObj.getTime())) {
    return { date: "—", time: "" };
  }

  return {
    date: dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: dateObj.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }),
  };
}

export function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function datetimeLocalToISO(value: string): string {
  return new Date(value).toISOString();
}
