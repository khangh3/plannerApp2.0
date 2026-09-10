import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";
import type { DailySchedule, ScheduleBlock } from "./types/schedule";
import SchedulePage from "./Example";
import SchedulePage2 from "./Example2";

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

// function App() {
//   return <SchedulePage />;
// }

function App() {
  return <SchedulePage2 />;
}

export default App;
