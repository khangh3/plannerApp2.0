import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";
import type { DailySchedule, ScheduleBlock } from "./types/schedule";
import SchedulePage from "./Example";
import SchedulePage2 from "./Example2";

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

// function App() {
//   return (
//     <>
//       <h1>Workday</h1>
//       <h1>24-Hour Overview</h1>
//       <div className='h-3 w-3xl overflow-hidden rounded-full bg-gray-200'>
//         <div
//           className='h-full bg-blue-600 transition-all duration-300'
//           style={{ width: `${50}%` }}></div>
//       </div>
//       <h1>Time Allocation</h1>
//       <h1>Schedule Summary</h1>
//     </>
//   );
// }

function App() {
  return <SchedulePage />;
}

// function App() {
//   return <SchedulePage2 />;
// }

export default App;
