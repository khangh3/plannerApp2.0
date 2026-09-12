import type { scheduleBlock, dailySchedule } from "./types/schedule";
import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";

const scheduleBlock: scheduleBlock[] = [
  {
    id: uuidv4(),
    title: "Work",
    category: "work",
    availability: "busy",
    timeWindow: {
      startTime: { hour: 6, minute: 0 },
      endTime: { hour: 15, minute: 15 },
    },
  },
  {
    id: uuidv4(),
    title: "Sleep",
    category: "sleep",
    availability: "busy",
    timeWindow: {
      startTime: { hour: 0, minute: 0 },
      endTime: { hour: 6, minute: 0 },
    },
  },
  {
    id: uuidv4(),
    title: "Sleep",
    category: "sleep",
    availability: "busy",
    timeWindow: {
      startTime: { hour: 23, minute: 0 },
      endTime: { hour: 24, minute: 0 },
    },
  },
  {
    id: uuidv4(),
    title: "Study",
    category: "study",
    availability: "flexible",
    timeWindow: {
      startTime: { hour: 15, minute: 15 },
      endTime: { hour: 18, minute: 15 },
    },
  },
  {
    id: uuidv4(),
    title: "Gym",
    category: "exercise",
    availability: "flexible",
    timeWindow: {
      startTime: { hour: 18, minute: 15 },
      endTime: { hour: 19, minute: 15 },
    },
  },
];

export const mockDailySchedule: dailySchedule = {
  date: dayjs(),
  blocks: scheduleBlock,
};
