import { CATEGORY_META, GROUP_ORDER } from "../styles";
import type { activityGroup } from "../styles";
import type {
  activityCategory,
  scheduleBlock,
  timeOfDay,
} from "../types/schedule";
import { toMinutes, fromMinutes, durationOf } from "./time";

export type groupSummary = {
  group: activityGroup;
  totalMinutes: number;
  percentageOfDay: number;
};

type categoryTotal = {
  category: activityCategory;
  totalMinutes: number;
  percentageOfDay: number;
};

type freeWindow = {
  startTime: timeOfDay;
  endTime: timeOfDay;
  durationMinutes: number;
};

export function analyzeSchedule(blocks: scheduleBlock[]) {
  const totalsByCategory: Partial<Record<activityCategory, number>> = {};
  for (const b of blocks) {
    totalsByCategory[b.category] =
      (totalsByCategory[b.category] || 0) + durationOf(b.startTime, b.endTime);
  }
  const categoryBreakdown: categoryTotal[] = (
    Object.entries(totalsByCategory) as [activityCategory, number][]
  )
    .map(([category, totalMinutes]) => ({
      category,
      totalMinutes,
      percentageOfDay: (totalMinutes / 1440) * 100,
    }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes);

  const largestCategory = categoryBreakdown[0];

  let totalBusyMinutes = 0;
  let totalFlexibleMinutes = 0;
  for (const b of blocks) {
    const mins = durationOf(b.startTime, b.endTime);
    if (b.availability === "busy") totalBusyMinutes += mins;
    else totalFlexibleMinutes += mins;
  }

  // Free time isn't tagged on a block — it's whatever time no block covers.
  const timeline = new Array(1440).fill(false); // false = free (uncovered)
  for (const b of blocks) {
    const start = toMinutes(b.startTime);
    const dur = durationOf(b.startTime, b.endTime);
    for (let i = 0; i < dur; i++) timeline[(start + i) % 1440] = true;
  }
  const freeWindows: freeWindow[] = [];
  let runStart: number | null = null;
  for (let m = 0; m <= 1440; m++) {
    const isFree = m < 1440 && !timeline[m];
    if (isFree && runStart === null) runStart = m;
    if (!isFree && runStart !== null) {
      freeWindows.push({
        startTime: fromMinutes(runStart),
        endTime: fromMinutes(m),
        durationMinutes: m - runStart,
      });
      runStart = null;
    }
  }
  const longestFreeWindow = freeWindows.reduce<freeWindow | undefined>(
    (best, w) => (!best || w.durationMinutes > best.durationMinutes ? w : best),
    undefined,
  );
  const totalFreeMinutes = freeWindows.reduce(
    (sum, w) => sum + w.durationMinutes,
    0,
  );

  return {
    categoryBreakdown,
    freeWindows,
    longestFreeWindow,
    largestCategory,
    totalBusyMinutes,
    totalFlexibleMinutes,
    totalFreeMinutes,
  };
}

// Roll the fine-grained categoryBreakdown up into the 7 display groups used
// by the legend / allocation panel / "most time" insight.
export function groupBreakdown(
  categoryBreakdown: categoryTotal[],
): groupSummary[] {
  const totals: Partial<Record<activityGroup, number>> = {};
  for (const c of categoryBreakdown) {
    const g = CATEGORY_META[c.category].group;
    totals[g] = (totals[g] || 0) + c.totalMinutes;
  }
  return GROUP_ORDER.filter((g) => (totals[g] || 0) > 0)
    .map((g) => ({
      group: g,
      totalMinutes: totals[g] || 0,
      percentageOfDay: ((totals[g] || 0) / 1440) * 100,
    }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes);
}
