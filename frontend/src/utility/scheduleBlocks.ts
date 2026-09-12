import { v4 as uuidv4 } from "uuid";
import type { scheduleBlock, timeWindow } from "../types/schedule";
import { toMinutes } from "./time";

export const blocksOverlap = (a: timeWindow, b: timeWindow): boolean =>
  toMinutes(a.startTime) < toMinutes(b.endTime) &&
  toMinutes(b.startTime) < toMinutes(a.endTime);

export const findOverlappingBlock = (
  candidate: timeWindow,
  blocks: scheduleBlock[],
  excludeId?: string,
): scheduleBlock | undefined =>
  blocks.find(
    (b) => b.id !== excludeId && blocksOverlap(candidate, b.timeWindow),
  );

export const isValidTimeWindow = (tw: timeWindow): boolean =>
  toMinutes(tw.endTime) > toMinutes(tw.startTime);

export const createScheduleBlock = (
  input: Omit<scheduleBlock, "id">,
): scheduleBlock => ({ ...input, id: uuidv4() });
