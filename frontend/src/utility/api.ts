import dayjs from "dayjs";
import objectSupport from "dayjs/plugin/objectSupport";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { supabase } from "../supabaseClient";
import type { dataBlock } from "../types/dbTypes";
import type {
  activityCategory,
  availability,
  scheduleBlock,
} from "../types/schedule";

dayjs.extend(objectSupport);
dayjs.extend(customParseFormat);

export const addBlock = async (block: scheduleBlock) => {
  const dataBlock = convertToDataBlock(block);
  const { error } = await supabase.from("time_block").insert(dataBlock);

  if (error) console.log(error);

  return;
};

export const updateBlock = async (block: scheduleBlock) => {
  const dataBlock = convertToDataBlock(block);
  const { error } = await supabase
    .from("time_block")
    .update(dataBlock)
    .eq("id", dataBlock.id);

  if (error) console.log(error);
  return;
};

export const convertToScheduleBlock = (block: dataBlock): scheduleBlock => {
  const startTime = dayjs(block.start_time, "HH:mm:ss");
  const endTime = dayjs(block.end_time, "HH:mm:ss");
  return {
    id: block.id,
    title: block.title,
    description: block.description,
    category: block.category as activityCategory,
    availability: block.availability as availability,
    startTime: {
      hour: startTime.get("hour"),
      minute: startTime.get("minute"),
    },
    endTime: {
      hour: endTime.get("hour"),
      minute: endTime.get("minute"),
    },
  };
};

export const convertToDataBlock = (block: scheduleBlock): dataBlock => {
  return {
    id: block.id,
    title: block.title,
    description: block.description,
    category: block.category,
    availability: block.availability,
    start_time: dayjs(block.startTime).format("HH:mm:ss"),
    end_time: dayjs(block.endTime).format("HH:mm:ss"),
  };
};
