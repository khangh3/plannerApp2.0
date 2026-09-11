import dayjs from "dayjs";
import type { timeOfDay, timeWindow } from "../types/schedule";

/* ------------------------------ time helpers ------------------------------ */

export const toMinutes = (tod: timeOfDay) => tod.hour * 60 + tod.minute;

export const fromMinutes = (mins: number): timeOfDay => {
  const m = ((mins % 1440) + 1440) % 1440;
  return { hour: Math.floor(m / 60), minute: m % 60 };
};

export const fmtTime = (tod: timeOfDay) => {
  return dayjs()
    .hour(tod.hour % 24)
    .minute(tod.minute)
    .format("h:mm A");
};

export const durationOf = (b: timeWindow) =>
  toMinutes(b.endTime) - toMinutes(b.startTime);

export const hoursLabel = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};
