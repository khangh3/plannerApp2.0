import { v4 as uuidv4 } from "uuid";
import type { scheduleBlock, timeOfDay } from "../types/schedule";
import { toMinutes } from "./time";

const endOfDayMinutes = (t: timeOfDay) =>
  t.hour === 0 && t.minute === 0 ? 1440 : toMinutes(t);

export const blocksOverlap = (
  b: scheduleBlock,
  startTime: timeOfDay,
  endTime: timeOfDay,
): boolean => {
  return (
    toMinutes(b.startTime) < endOfDayMinutes(endTime) &&
    toMinutes(startTime) < endOfDayMinutes(b.endTime)
  );
};

export const findOverlappingBlock = (
  startTime: timeOfDay,
  endTime: timeOfDay,
  blocks: scheduleBlock[],
  excludeId?: string,
): scheduleBlock | undefined => {
  return blocks.find(
    (b) => b.id !== excludeId && blocksOverlap(b, startTime, endTime),
  );
};

export const isValidTimeWindow = (
  startTime: timeOfDay,
  endTime: timeOfDay,
): boolean => {
  if (endTime.hour === 0 && endTime.minute === 0) return true;
  return toMinutes(endTime) > toMinutes(startTime);
};

export const createScheduleBlock = (
  input: Omit<scheduleBlock, "id">,
): scheduleBlock => ({ ...input, id: uuidv4() });
