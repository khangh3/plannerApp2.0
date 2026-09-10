import React, { useMemo, useState } from "react";
import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CalendarDays,
  Clock,
  Sun,
  User,
} from "lucide-react";

/* -------------------------------------------------------------------------
 * Types (documented in JS via shape, matching the provided TS definitions)
 *
 * ActivityCategory: "sleep" | "work" | "commute" | "meal" | "exercise"
 *   | "study" | "hobby" | "personal" | "free" | "other"
 * Availability: "busy" | "flexible" | "free"
 * TimeOfDay: { hour, minute } -- to-the-minute precision.
 * ScheduleBlock: { id, title, description?, category, availability,
 *   startTime, endTime }
 * DailySchedule: { date: Dayjs, blocks: ScheduleBlock[] }
 * CategorySummary: { category, totalMinutes, percentageOfDay }
 * TimeWindow: { startTime, endTime, durationMinutes }
 * ScheduleAnalysis: { categoryBreakdown, freeWindows, longestFreeWindow?,
 *   largestCategory?, totalBusyMinutes, totalFlexibleMinutes, totalFreeMinutes }
 * ---------------------------------------------------------------------- */

// Fine-grained category metadata. Categories that are grouped together for
// display (e.g. work + commute) intentionally share the same color so the
// schedule, overview bar, and legend all read consistently.
const CATEGORY_META = {
  sleep: { color: "#A9C7E8", group: "sleep" },
  personal: { color: "#F0D9A8", group: "personalMeals" },
  meal: { color: "#F0D9A8", group: "personalMeals" },
  work: { color: "#A9D8B0", group: "workCommute" },
  commute: { color: "#A9D8B0", group: "workCommute" },
  exercise: { color: "#C9B8E8", group: "exercise" },
  study: { color: "#A8DDD5", group: "study" },
  hobby: { color: "#F2B8BE", group: "hobbyFree" },
  free: { color: "#F2B8BE", group: "hobbyFree" },
  other: { color: "#C9C9C9", group: "other" },
};

const GROUP_META = {
  sleep: { label: "Sleep", color: "#A9C7E8" },
  workCommute: { label: "Work (incl. commute)", color: "#A9D8B0" },
  personalMeals: { label: "Personal / Meals", color: "#F0D9A8" },
  exercise: { label: "Exercise", color: "#C9B8E8" },
  study: { label: "Study", color: "#A8DDD5" },
  hobbyFree: { label: "Hobby / Free Time", color: "#F2B8BE" },
  other: { label: "Other (wind down, etc.)", color: "#C9C9C9" },
};
const GROUP_ORDER = [
  "sleep",
  "workCommute",
  "personalMeals",
  "exercise",
  "study",
  "hobbyFree",
  "other",
];

/* --------------------------- sample data builder --------------------------- */

function block(title, category, availability, startTime, endTime) {
  return { id: uuidv4(), title, category, availability, startTime, endTime };
}
function t(hour, minute = 0) {
  return { hour, minute };
}

function buildSampleBlocks() {
  return [
    block("Sleep", "sleep", "busy", t(0), t(6)),
    block("Wake up, shower, get ready", "personal", "flexible", t(6), t(7)),
    block("Breakfast + commute", "meal", "busy", t(7), t(8)),
    block("Work \u2013 focused tasks", "work", "busy", t(8), t(10)),
    block("Lunch + short walk", "meal", "flexible", t(10), t(10, 30)),
    block("Work \u2013 meetings / projects", "work", "busy", t(11, 30), t(16)),
    block("Commute home", "commute", "busy", t(16), t(17)),
    block("Exercise / gym", "exercise", "busy", t(17), t(18)),
    block("Dinner + cleanup", "meal", "flexible", t(18), t(19)),
    block("Study / skill-building", "study", "flexible", t(19), t(20)),
    block("Hobby / free time", "hobby", "free", t(20), t(22)),
    block("Wind down", "other", "free", t(22), t(23)),
    block("Sleep", "sleep", "busy", t(23), t(24)),
  ];
}

/* ------------------------------ time helpers ------------------------------ */

const toMinutes = (tod) => tod.hour * 60 + tod.minute;
const fromMinutes = (mins) => {
  const m = ((mins % 1440) + 1440) % 1440;
  return { hour: Math.floor(m / 60), minute: m % 60 };
};
const fmtTime = (tod) =>
  dayjs()
    .hour(tod.hour % 24)
    .minute(tod.minute)
    .format("h:mm A");
const durationOf = (b) => {
  const start = toMinutes(b.startTime);
  let end = toMinutes(b.endTime);
  if (end <= start) end += 1440;
  return end - start;
};
const hoursLabel = (mins) => {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

/* ------------------------------- analysis --------------------------------- */

function analyzeSchedule(blocks) {
  const totalsByCategory = {};
  for (const b of blocks) {
    totalsByCategory[b.category] =
      (totalsByCategory[b.category] || 0) + durationOf(b);
  }
  const categoryBreakdown = Object.entries(totalsByCategory)
    .map(([category, totalMinutes]) => ({
      category,
      totalMinutes,
      percentageOfDay: (totalMinutes / 1440) * 100,
    }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes);

  const largestCategory = categoryBreakdown[0];

  let totalBusyMinutes = 0;
  let totalFlexibleMinutes = 0;
  let totalFreeMinutes = 0;
  for (const b of blocks) {
    const mins = durationOf(b);
    if (b.availability === "busy") totalBusyMinutes += mins;
    else if (b.availability === "flexible") totalFlexibleMinutes += mins;
    else totalFreeMinutes += mins;
  }

  const timeline = new Array(1440).fill(true); // true = not free
  for (const b of blocks) {
    const start = toMinutes(b.startTime);
    const dur = durationOf(b);
    for (let i = 0; i < dur; i++)
      timeline[(start + i) % 1440] = b.availability !== "free";
  }
  const freeWindows = [];
  let runStart = null;
  for (let m = 0; m <= 1440; m++) {
    const isFree = m < 1440 && !timeline[m];
    if (isFree && runStart === null) runStart = m;
    if (!isFree && runStart !== null) {
      freeWindows.push({
        startTime: fromMinutes(runStart),
        endTime: fromMinutes(m),
        durationMinutes: m - runStart,
      });
      runStart = null;
    }
  }
  const longestFreeWindow = freeWindows.reduce(
    (best, w) => (!best || w.durationMinutes > best.durationMinutes ? w : best),
    undefined,
  );

  return {
    categoryBreakdown,
    freeWindows,
    longestFreeWindow,
    largestCategory,
    totalBusyMinutes,
    totalFlexibleMinutes,
    totalFreeMinutes,
  };
}

// Roll the fine-grained categoryBreakdown up into the 7 display groups used
// by the legend / allocation panel / "most time" insight.
function groupBreakdown(categoryBreakdown) {
  const totals = {};
  for (const c of categoryBreakdown) {
    const g = CATEGORY_META[c.category].group;
    totals[g] = (totals[g] || 0) + c.totalMinutes;
  }
  return GROUP_ORDER.filter((g) => totals[g] > 0)
    .map((g) => ({
      group: g,
      totalMinutes: totals[g],
      percentageOfDay: (totals[g] / 1440) * 100,
    }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes);
}

/* --------------------------------- UI bits --------------------------------- */

const FONT = "'Space Mono', monospace";

function Panel({ children, style, className = "" }) {
  return (
    <section
      className={`rounded-xl border p-5 ${className}`}
      style={{
        backgroundColor: "#FBF6EB",
        borderColor: "rgba(90,66,46,0.18)",
        ...style,
      }}>
      {children}
    </section>
  );
}

function BinderDots({ count = 15 }) {
  return (
    <div className='hidden md:flex flex-col items-center justify-between h-full py-2'>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className='w-2.5 h-2.5 rounded-full'
          style={{ backgroundColor: "rgba(90,66,46,0.35)" }}
        />
      ))}
    </div>
  );
}

function ScheduleColumn({ label, windowStart, windowEnd, blocks }) {
  const span = windowEnd - windowStart;
  const hourMarks = [];
  for (let m = windowStart; m < windowEnd; m += 60) hourMarks.push(m);

  const positioned = blocks
    .map((b) => {
      const realStart = toMinutes(b.startTime);
      const realEnd = realStart + durationOf(b);
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
    .filter(Boolean);

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
                className='w-[52px] shrink-0 -translate-y-1/2 text-[11px] text-right pr-2'
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
          {positioned.map(
            ({ block: b, topPct, heightPct, labelStart, labelEnd }) => {
              const meta = CATEGORY_META[b.category];
              const compact = heightPct < 3.2;
              return (
                <div
                  key={b.id}
                  className='absolute left-2 right-0 rounded-md overflow-hidden px-3'
                  style={{
                    top: `${topPct}%`,
                    height: `${heightPct}%`,
                    backgroundColor: meta.color + "AA",
                    minHeight: "18px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}>
                  <div
                    className='italic truncate'
                    style={{
                      color: "#3B2C20",
                      fontFamily: FONT,
                      fontSize: compact ? "12px" : "13.5px",
                      fontWeight: 700,
                    }}>
                    {b.title}
                  </div>
                  {!compact && (
                    <div
                      className='truncate'
                      style={{
                        color: "#6B5A46",
                        fontFamily: FONT,
                        fontSize: "11px",
                      }}>
                      {fmtTime(labelStart)} {"\u2013"} {fmtTime(labelEnd)}
                    </div>
                  )}
                </div>
              );
            },
          )}
        </div>
      </div>
    </div>
  );
}

function OverviewBar({ blocks }) {
  return (
    <div>
      <div
        className='flex w-full h-8 rounded-md overflow-hidden border'
        style={{ borderColor: "rgba(90,66,46,0.2)" }}>
        {blocks.map((b) => (
          <div
            key={b.id}
            style={{
              flexGrow: durationOf(b),
              flexBasis: 0,
              backgroundColor: CATEGORY_META[b.category].color,
              borderRight: "1px solid rgba(255,255,255,0.4)",
            }}
          />
        ))}
      </div>
      <div
        className='flex mt-1.5 text-[10.5px]'
        style={{ color: "#8C7A63", fontFamily: FONT }}>
        {["12 AM", "6 AM", "12 PM", "6 PM", "12 AM"].map((lbl, i) => (
          <div
            key={i}
            className='flex-1 text-center first:text-left last:text-right'>
            {lbl}
          </div>
        ))}
      </div>
      <div className='flex flex-wrap gap-x-5 gap-y-2 mt-4'>
        {GROUP_ORDER.map((g) => (
          <div key={g} className='flex items-center gap-1.5'>
            <span
              className='w-2.5 h-2.5 rounded-full shrink-0'
              style={{ backgroundColor: GROUP_META[g].color }}
            />
            <span
              className='text-[12px]'
              style={{ color: "#3B2C20", fontFamily: FONT }}>
              {GROUP_META[g].label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AllocationRow({ summary }) {
  const meta = GROUP_META[summary.group];
  return (
    <div className='flex items-center gap-3'>
      <span
        className='w-[168px] shrink-0 text-[13px] truncate'
        style={{ color: "#3B2C20", fontFamily: FONT }}>
        {meta.label}
      </span>
      <div
        className='flex-1 h-3 rounded-full overflow-hidden'
        style={{ backgroundColor: "#E7DCC6" }}>
        <div
          className='h-full rounded-full'
          style={{
            width: `${summary.percentageOfDay}%`,
            backgroundColor: meta.color,
          }}
        />
      </div>
      <span
        className='w-8 text-right text-[12.5px] tabular-nums'
        style={{ color: "#6B5A46", fontFamily: FONT }}>
        {hoursLabel(summary.totalMinutes)}
      </span>
      <span
        className='w-10 text-right text-[12.5px] tabular-nums'
        style={{ color: "#6B5A46", fontFamily: FONT }}>
        {Math.round(summary.percentageOfDay)}%
      </span>
    </div>
  );
}

function InsightCard({ icon: Icon, label, value, caption }) {
  return (
    <div
      className='flex-1 rounded-lg border p-3.5'
      style={{
        borderColor: "rgba(90,66,46,0.18)",
        backgroundColor: "#F3ECDC",
      }}>
      <div className='flex items-center gap-1.5 mb-2'>
        <Icon size={14} color='#6B5A46' />
        <span
          className='text-[11px]'
          style={{ color: "#6B5A46", fontFamily: FONT }}>
          {label}
        </span>
      </div>
      <div
        className='text-[16px] font-bold mb-0.5 truncate'
        style={{ color: "#3B2C20", fontFamily: FONT }}>
        {value}
      </div>
      <div
        className='text-[11px]'
        style={{ color: "#6B5A46", fontFamily: FONT }}>
        {caption}
      </div>
    </div>
  );
}

/* --------------------------------- main app --------------------------------- */

export default function DailySchedulePlanner() {
  const [date, setDate] = useState(dayjs("2024-04-23"));
  const [viewMode, setViewMode] = useState("day");
  const blocks = useMemo(() => buildSampleBlocks(), []);
  const analysis = useMemo(() => analyzeSchedule(blocks), [blocks]);
  const groups = useMemo(
    () => groupBreakdown(analysis.categoryBreakdown),
    [analysis],
  );

  const mostTime = groups[0];
  const freeMinutes = analysis.totalFlexibleMinutes + analysis.totalFreeMinutes;

  return (
    <div
      className='w-full min-h-screen flex items-center justify-center p-4 md:p-8'
      style={{ backgroundColor: "#CBB99C" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');`}</style>

      <div
        className='w-full rounded-3xl p-6 md:p-8'
        style={{
          maxWidth: "1650px",
          backgroundColor: "#F1E8D6",
          border: "10px solid #6B4A34",
          boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
          fontFamily: FONT,
        }}>
        {/* Header */}
        <div
          className='flex flex-wrap items-center justify-between gap-4 pb-5 mb-5 border-b-2'
          style={{ borderColor: "rgba(90,66,46,0.25)" }}>
          <div className='flex items-center gap-3'>
            <div
              className='w-14 h-14 rounded-full border-2 flex items-center justify-center shrink-0'
              style={{ borderColor: "#3B2C20" }}>
              <svg width='24' height='24' viewBox='0 0 24 24' fill='none'>
                <path d='M12 21 V6' stroke='#3B2C20' strokeWidth='1.5' />
                <path
                  d='M12 12 Q18 8 20 3'
                  stroke='#3B2C20'
                  strokeWidth='1.5'
                  fill='none'
                />
                <path
                  d='M12 16 Q6 12 4 7'
                  stroke='#3B2C20'
                  strokeWidth='1.5'
                  fill='none'
                />
              </svg>
            </div>
            <div>
              <h1
                className='text-[30px] font-bold leading-tight'
                style={{ color: "#3B2C20", fontFamily: FONT }}>
                Daily Schedule
              </h1>
              <p
                className='text-[13px]'
                style={{ color: "#6B5A46", fontFamily: FONT }}>
                Plan your time. Live with intention.
              </p>
            </div>
          </div>

          <div
            className='flex items-center gap-2 px-3 py-2 rounded-lg border'
            style={{
              backgroundColor: "#FBF6EB",
              borderColor: "rgba(90,66,46,0.2)",
            }}>
            <button
              onClick={() => setDate((d) => d.subtract(1, "day"))}
              aria-label='Previous day'
              className='p-0.5 rounded hover:bg-black/5'>
              <ChevronLeft size={16} color='#3B2C20' />
            </button>
            <span
              className='text-[14px] px-1 tabular-nums font-bold'
              style={{ color: "#3B2C20", fontFamily: FONT }}>
              {date.format("dddd, MMM D, YYYY")}
            </span>
            <button
              onClick={() => setDate((d) => d.add(1, "day"))}
              aria-label='Next day'
              className='p-0.5 rounded hover:bg-black/5'>
              <ChevronRight size={16} color='#3B2C20' />
            </button>
            <div
              className='w-px h-5 mx-1'
              style={{ backgroundColor: "rgba(90,66,46,0.25)" }}
            />
            <CalendarDays size={16} color='#3B2C20' />
          </div>

          <div className='flex items-center gap-4'>
            <div
              className='flex rounded-lg border overflow-hidden'
              style={{ borderColor: "rgba(90,66,46,0.2)" }}>
              {["Day", "Week", "Month"].map((v) => {
                const active = viewMode === v.toLowerCase();
                return (
                  <button
                    key={v}
                    onClick={() => setViewMode(v.toLowerCase())}
                    className='px-4 py-2 text-[13px] font-bold'
                    style={{
                      backgroundColor: active ? "#A9C7E8" : "#FBF6EB",
                      color: "#3B2C20",
                      fontFamily: FONT,
                    }}>
                    {v}
                  </button>
                );
              })}
            </div>
            <div
              className='w-px h-8'
              style={{ backgroundColor: "rgba(90,66,46,0.25)" }}
            />
            <div className='flex items-center gap-2 cursor-pointer'>
              <div
                className='w-9 h-9 rounded-full border-2 flex items-center justify-center'
                style={{ borderColor: "#3B2C20" }}>
                <User size={16} color='#3B2C20' />
              </div>
              <span
                className='text-[13.5px] font-bold'
                style={{ color: "#3B2C20", fontFamily: FONT }}>
                Hlao Khang
              </span>
              <ChevronDown size={14} color='#3B2C20' />
            </div>
          </div>
        </div>

        {viewMode !== "day" && (
          <div
            className='mb-5 text-[13px] italic'
            style={{ color: "#6B5A46", fontFamily: FONT }}>
            {viewMode === "week" ? "Week" : "Month"} view is coming soon \u2014
            showing Day view below.
          </div>
        )}

        {/* Main grid: AM column, PM column, right panel */}
        <div
          className='grid gap-6'
          style={{ gridTemplateColumns: "1fr 24px 1fr 1.2fr" }}>
          <Panel style={{ minHeight: "780px" }}>
            <ScheduleColumn
              label='12 AM \u2013 12 PM'
              windowStart={0}
              windowEnd={720}
              blocks={blocks}
            />
          </Panel>

          <BinderDots />

          <Panel style={{ minHeight: "780px" }}>
            <ScheduleColumn
              label='12 PM \u2013 12 AM'
              windowStart={720}
              windowEnd={1440}
              blocks={blocks}
            />
          </Panel>

          <div className='flex flex-col gap-6'>
            <Panel>
              <h2
                className='text-[19px] font-bold mb-4'
                style={{ color: "#3B2C20", fontFamily: FONT }}>
                24-Hour Overview
              </h2>
              <OverviewBar blocks={blocks} />
            </Panel>

            <Panel>
              <h2
                className='text-[19px] font-bold mb-4'
                style={{ color: "#3B2C20", fontFamily: FONT }}>
                Time Allocation
              </h2>
              <div className='flex flex-col gap-3'>
                {groups.map((g) => (
                  <AllocationRow key={g.group} summary={g} />
                ))}
              </div>
            </Panel>

            <Panel>
              <h2
                className='text-[19px] font-bold mb-4'
                style={{ color: "#3B2C20", fontFamily: FONT }}>
                Key Insights
              </h2>
              <div className='flex gap-3'>
                {mostTime && (
                  <InsightCard
                    icon={Clock}
                    label='Most Time'
                    value={GROUP_META[mostTime.group].label.split(" ")[0]}
                    caption={`${hoursLabel(mostTime.totalMinutes)} (${Math.round(mostTime.percentageOfDay)}%)`}
                  />
                )}
                {analysis.longestFreeWindow && (
                  <InsightCard
                    icon={Sun}
                    label='Largest Free Block'
                    value={hoursLabel(
                      analysis.longestFreeWindow.durationMinutes,
                    )}
                    caption={`${fmtTime(analysis.longestFreeWindow.startTime)} \u2013 ${fmtTime(analysis.longestFreeWindow.endTime)}`}
                  />
                )}
                <InsightCard
                  icon={CalendarDays}
                  label='Overall Free Time'
                  value={`~${hoursLabel(freeMinutes)}`}
                  caption={`(${Math.round((freeMinutes / 1440) * 100)}% of day)`}
                />
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
