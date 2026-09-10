import React, { useState } from "react";
import { mockDailySchedule } from "./mockData";

function SchedulePage() {
  const [schedule, setSchedule] = useState(mockDailySchedule);
  return (
    <>
      {/** Content: schedule column (~800fr) + right column (~890fr) */}
      <main className='flex-1 min-w-0 p-6 md:p-8'>
        <div
          className='grid'
          style={{
            gridTemplateColumns: "800fr 890fr",
            columnGap: "24px",
            rowGap: "16px",
          }}>
          {/**Row 1-3, Col 1: Schedule */}
          <Panel
            style={{
              gridRow: "span 3",
              display: "flex",
              flexDirection: "colum",
              overflow: "hidden",
            }}>
            <h2
              className='mb-2 shrink-0'
              style={{
                fontFamily: "'Caveat', cursive",
                fontSize: "24px",
                color: "#2E3A50",
              }}>
              Today's Schedule
            </h2>
            <ScheduleTimeline blocks={schedule.blocks} />
          </Panel>
        </div>
      </main>
    </>
  );
}

function Panel({ children, style, className = "" }) {
  return (
    <section
      className={`rounded-xl border p-4 ${className}`}
      style={{
        backgroundColor: "#F6F2E6",
        borderColor: "rgba(46,58,80,0.12)",
        ...style,
      }}>
      {children}
    </section>
  );
}

function ScheduleTimeline({ blocks }) {
  const hourMarks = Array(24);
  return <></>;
}

export default SchedulePage;
