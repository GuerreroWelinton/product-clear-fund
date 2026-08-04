/**
 * Calendar-day boundaries in the business timezone.
 *
 * Timestamps persist in UTC; business rules run in the business timezone
 * (TECHNICAL_CONVENTIONS.md). Resolving a calendar date against UTC — or worse,
 * against the process timezone — moves late-evening rows into the next day.
 */
export const BUSINESS_TIME_ZONE = "America/Guayaquil";

const wallClockParts = new Intl.DateTimeFormat("en-US", {
  timeZone: BUSINESS_TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** Offset between the business timezone and UTC at a given instant. */
function zoneOffsetMs(instant: Date): number {
  const parts = wallClockParts.formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((candidate) => candidate.type === type)?.value ?? 0);

  const wallClockAsUtc = Date.UTC(
    part("year"),
    part("month") - 1,
    part("day"),
    part("hour"),
    part("minute"),
    part("second"),
  );
  return wallClockAsUtc - instant.getTime();
}

/** Pure calendar arithmetic on a date-only value; no timezone involved. */
function nextCalendarDay(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

/** First instant of `isoDate` (YYYY-MM-DD) in the business timezone. */
export function businessDayStart(isoDate: string): Date {
  const wallClock = new Date(`${isoDate}T00:00:00.000Z`).getTime();
  // Two passes: the first offset is read at a guessed instant, which can sit
  // on the wrong side of a jump in zones that observe DST.
  const guess = new Date(wallClock - zoneOffsetMs(new Date(wallClock)));
  return new Date(wallClock - zoneOffsetMs(guess));
}

/** First instant after `isoDate`, i.e. the exclusive end of that day. */
export function businessDayEndExclusive(isoDate: string): Date {
  return businessDayStart(nextCalendarDay(isoDate));
}
