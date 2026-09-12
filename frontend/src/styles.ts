import type { activityCategory } from "./types/schedule";

/* --------------------------------- UI bits --------------------------------- */

export const FONT = "'Space Mono', monospace";

export type activityGroup =
  | "sleep"
  | "workCommute"
  | "personalMeals"
  | "exercise"
  | "study"
  | "hobbyFree"
  | "other";

// Fine-grained category metadata. Categories that are grouped together for
// display (e.g. work + commute) intentionally share the same color so the
// schedule, overview bar, and legend all read consistently.
export const CATEGORY_META: Record<
  activityCategory,
  { color: string; group: activityGroup }
> = {
  sleep: { color: "#A9C7E8", group: "sleep" },
  personal: { color: "#F0D9A8", group: "personalMeals" },
  meal: { color: "#F0D9A8", group: "personalMeals" },
  work: { color: "#A9D8B0", group: "workCommute" },
  commute: { color: "#A9D8B0", group: "workCommute" },
  exercise: { color: "#C9B8E8", group: "exercise" },
  study: { color: "#A8DDD5", group: "study" },
  hobby: { color: "#F2B8BE", group: "hobbyFree" },
  other: { color: "#C9C9C9", group: "other" },
};

export const GROUP_META: Record<activityGroup, { label: string; color: string }> = {
  sleep: { label: "Sleep", color: "#A9C7E8" },
  workCommute: { label: "Work (incl. commute)", color: "#A9D8B0" },
  personalMeals: { label: "Personal / Meals", color: "#F0D9A8" },
  exercise: { label: "Exercise", color: "#C9B8E8" },
  study: { label: "Study", color: "#A8DDD5" },
  hobbyFree: { label: "Hobby / Free Time", color: "#F2B8BE" },
  other: { label: "Other (wind down, etc.)", color: "#C9C9C9" },
};
export const GROUP_ORDER: activityGroup[] = [
  "sleep",
  "workCommute",
  "personalMeals",
  "exercise",
  "study",
  "hobbyFree",
  "other",
];
