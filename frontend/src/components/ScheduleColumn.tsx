import dayjs from "dayjs";
import { FONT } from "../styles";
import { CATEGORY_META } from "../styles";
import type { scheduleBlock, timeOfDay } from "../types/schedule";
import { toMinutes, fromMinutes, fmtTime, durationOf } from "../utility/time";

function TimeBlock({
  position,
  onClick,
}: {
  position: position;
  onClick: () => void;
}) {
  const { block, topPct, heightPct, labelStart, labelEnd } = position;
  const meta = CATEGORY_META[block.category];
  const compact = heightPct < 3.2;

  return (
    <div
      key={block.id}
      className='absolute left-2 right-0 rounded-md overflow-hidden px-3'
      style={{
        top: `${topPct}%`,
        height: `${heightPct}%`,
        backgroundColor: meta.color + "AA",
        minHeight: "18px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
      onClick={onClick}>
      <div
        className='italic truncate'
        style={{
          color: "#3B2C20",
          fontFamily: FONT,
          fontSize: compact ? "12px" : "13.5px",
          fontWeight: 700,
        }}>
        {block.title}
      </div>
      {!compact && (
        <div
          className='truncate'
          style={{
            color: "#6B5A46",
            fontFamily: FONT,
            fontSize: "11px",
          }}>
          {fmtTime(labelStart)} - {fmtTime(labelEnd)}
        </div>
      )}
    </div>
  );
}
type position = {
  block: scheduleBlock;
  topPct: number;
  heightPct: number;
  labelStart: timeOfDay;
  labelEnd: timeOfDay;
};

function ScheduleColumn({
  label,
  windowStart,
  windowEnd,
  blocks,
  onBlockClick,
}: {
  label: string;
  windowStart: number;
  windowEnd: number;
  blocks: scheduleBlock[];
  onBlockClick: (id: string) => void;
}) {
  const span = windowEnd - windowStart;
  const hourMarks = [];
  for (let m = windowStart; m < windowEnd; m += 60) hourMarks.push(m);

  const positioned: position[] = blocks
    .map((b) => {
      const realStart = toMinutes(b.timeWindow.startTime);
      const realEnd = realStart + durationOf(b.timeWindow);
      const clipStart = Math.max(realStart, windowStart);
      const clipEnd = Math.min(realEnd, windowEnd);
      if (clipEnd <= clipStart) return null;
      return {
        block: b,
        topPct: ((clipStart - windowStart) / span) * 100,
        heightPct: ((clipEnd - clipStart) / span) * 100,
        labelStart: fromMinutes(clipStart),
        labelEnd: fromMinutes(clipEnd),
      };
    })
    .filter((item): item is position => item !== null);

  return (
    <div className='flex flex-col h-full'>
      <h2
        className='text-[19px] font-bold pb-1.5 mb-3 border-b-2'
        style={{ color: "#3B2C20", borderColor: "#3B2C20", fontFamily: FONT }}>
        {label}
      </h2>
      <div className='flex-1 relative' style={{ minHeight: 0 }}>
        {hourMarks.map((m) => {
          const pct = ((m - windowStart) / span) * 100;
          return (
            <div
              key={m}
              className='absolute left-0 right-0 flex items-start'
              style={{ top: `${pct}%` }}>
              <span
                className='w-13 shrink-0 -translate-y-1/2 text-[11px] text-right pr-2'
                style={{ color: "#8C7A63", fontFamily: FONT }}>
                {dayjs()
                  .hour(Math.floor(m / 60) % 24)
                  .minute(0)
                  .format("h A")}
              </span>
              <div
                className='flex-1 border-t'
                style={{ borderColor: "rgba(90,66,46,0.15)" }}
              />
            </div>
          );
        })}
        <div
          className='absolute inset-0'
          style={{ left: "52px", paddingLeft: "10px" }}>
          {positioned.map((position) => (
            <TimeBlock
              key={position.block.id}
              position={position}
              onClick={() => onBlockClick(position.block.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default ScheduleColumn;
