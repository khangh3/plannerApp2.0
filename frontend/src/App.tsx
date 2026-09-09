import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";
import type { DailySchedule, ScheduleBlock } from "./types/schedule";

const ScheduleBlock: ScheduleBlock[] = [
  {
    id: uuidv4(),
    title: "Work",
    category: "work",
    availability: "busy",
    startTime: { hour: 6, minute: 0 },
    endTime: { hour: 3, minute: 15 },
  },
  {
    id: uuidv4(),
    title: "Sleep",
    category: "sleep",
    availability: "busy",
    startTime: { hour: 23, minute: 0 },
    endTime: { hour: 6, minute: 0 },
  },
  {
    id: uuidv4(),
    title: "Study",
    category: "study",
    availability: "flexible",
    startTime: { hour: 15, minute: 15 },
    endTime: { hour: 18, minute: 15 },
  },
  {
    id: uuidv4(),
    title: "Gym",
    category: "exercise",
    availability: "flexible",
    startTime: { hour: 18, minute: 16 },
    endTime: { hour: 19, minute: 15 },
  },
  {
    id: uuidv4(),
    title: "Free Time",
    category: "free",
    availability: "free",
    startTime: { hour: 19, minute: 15 },
    endTime: { hour: 23, minute: 0 },
  },
];

const DailySchedule: DailySchedule = {
  date: dayjs(),
  blocks: ScheduleBlock,
};

console.log(ScheduleBlock[0]);

function App() {
  return (
    <>
      <h1>Workday</h1>
      <h1>24-Hour Overview</h1>
      <h1>Time Allocation</h1>
    </>
  );
}

export default App;
