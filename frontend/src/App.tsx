import dayjs from "dayjs";

function App() {
  const day = dayjs("12-12-2023", "MM-DD-YYYY");
  console.log(day);
  return (
    <>
      <h1>Workday</h1>
      <h1>24-Hour Overview</h1>
      <h1>Time Allocation</h1>
    </>
  );
}

export default App;
