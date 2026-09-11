import { Dayjs } from "dayjs";

export type activityCategory =
  | "sleep"
  | "work"
  | "commute"
  | "meal"
  | "exercise"
  | "study"
  | "hobby"
  | "personal"
  | "free"
  | "other";

export type availability = "busy" | "flexible" | "free";

export type timeOfDay = {
  hour: number;
  minute: number;
};

export type scheduleBlock = {
  id: string;
  title: string;
  description?: string;
  category: activityCategory;
  availability: availability;
  timeWindow: timeWindow;
};

export type dailySchedule = {
  date: Dayjs;
  blocks: scheduleBlock[];
};

export type categorySummary = {
  category: activityCategory;
  totalMinutes: number;
  percentageOfDay: number;
};

export type timeWindow = {
  startTime: timeOfDay;
  endTime: timeOfDay;
};

export type scheduleAnalysis = {
  categoryBreakdown: categorySummary[];
  freeWindows: timeWindow[];
  longestFreeWindow?: timeWindow;
  largestCategory?: categorySummary;
  totalBusyMinutes: number;
  totalFlexibleMinutes: number;
  totalFreeMinutes: number;
};
