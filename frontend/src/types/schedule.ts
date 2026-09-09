import { Dayjs } from "dayjs";

export type ActivityCategory =
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

export type Availability = "busy" | "flexible" | "free";

export type TimeOfDay = {
  hour: number;
  minute: number;
};

export type ScheduleBlock = {
  id: string;
  title: string;
  description?: string;
  category: ActivityCategory;
  availability: Availability;
  startTime: TimeOfDay;
  endTime: TimeOfDay;
};

export type DailySchedule = {
  date: Dayjs;
  blocks: ScheduleBlock[];
};

export type CategorySummary = {
  category: ActivityCategory;
  totalMinutes: number;
  percentageOfDay: number;
};

export type TimeWindow = {
  startTime: TimeOfDay;
  endTime: TimeOfDay;
  durationMinutes: number;
};

export type ScheduleAnalysis = {
  categoryBreakdown: CategorySummary[];
  freeWindows: TimeWindow[];
  longestFreeWindow?: TimeWindow;
  largestCategory?: CategorySummary;
  totalBusyMinutes: number;
  totalFlexibleMinutes: number;
  totalFreeMinutes: number;
};
