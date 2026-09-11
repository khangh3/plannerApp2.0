import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";
import type { dailySchedule, scheduleBlock } from "./types/schedule";
import MockPage from "./Example";
import MockPage2 from "./Example2";
import SchedulePage from "./SchedulePage";

function App() {
  return <SchedulePage />;
  // return <MockPage2 />;
}

export default App;
