import { v4 as uuidv4 } from "uuid";
import type { scheduleBlock, timeOfDay } from "../types/schedule";
import { toMinutes } from "./time";

export const blocksOverlap = (
  a: scheduleBlock,
  startTime: timeOfDay,
  endTime: timeOfDay,
): boolean =>
  toMinutes(a.startTime) < toMinutes(endTime) &&
  toMinutes(startTime) < toMinutes(a.endTime);

export const findOverlappingBlock = (
  startTime: timeOfDay,
  endTime: timeOfDay,
  blocks: scheduleBlock[],
  excludeId?: string,
): scheduleBlock | undefined =>
  blocks.find(
    (b) => b.id !== excludeId && blocksOverlap(b, startTime, endTime),
  );

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
