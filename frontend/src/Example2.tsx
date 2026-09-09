import React, { useMemo, useState } from "react";
import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";
import {
  Home,
  Calendar,
  CheckSquare,
  Target,
  BookOpen,
  Sun,
  Moon,
  Coffee,
  Laptop,
  Utensils,
  Dumbbell,
  Car,
  Gamepad2,
  Users,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Clock,
  Star,
  CalendarDays,
  MoreVertical,
  CircleDot,
} from "lucide-react";

/* -------------------------------------------------------------------------
 * Types (documented in JS via shape, matching the provided TS definitions)
 *
 * ActivityCategory: "sleep" | "work" | "commute" | "meal" | "exercise"
 *   | "study" | "hobby" | "personal" | "free" | "other"
 * Availability: "busy" | "flexible" | "free"
 * TimeOfDay: { hour, minute }   -- hour/minute can express any clock time,
 *   not just whole hours. An endTime <= startTime means the block wraps
 *   past midnight into the next day.
 * ScheduleBlock: { id, title, description?, category, availability,
 *   startTime, endTime }
 * DailySchedule: { date: Dayjs, blocks: ScheduleBlock[] }
 * CategorySummary: { category, totalMinutes, percentageOfDay }
 * TimeWindow: { startTime, endTime, durationMinutes }
 * ScheduleAnalysis: { categoryBreakdown, freeWindows, longestFreeWindow?,
 *   largestCategory?, totalBusyMinutes, totalFlexibleMinutes, totalFreeMinutes }
 * ---------------------------------------------------------------------- */

const CATEGORY_META = {
  sleep: { label: "Sleep", color: "#7C9BC4", icon: Moon },
  personal: { label: "Personal", color: "#C6A6D9", icon: Sun },
  meal: { label: "Meals / Routine", color: "#EAC062", icon: Utensils },
  work: { label: "Work Related", color: "#74AE8A", icon: Laptop },
  commute: { label: "Commute", color: "#A7B2BE", icon: Car },
  exercise: { label: "Exercise", color: "#E2909A", icon: Dumbbell },
  study: { label: "Study", color: "#9C86D4", icon: BookOpen },
  hobby: { label: "Hobbies / Free", color: "#B79FDD", icon: Gamepad2 },
  free: { label: "Free Time", color: "#9FC3DE", icon: Users },
  other: { label: "Other", color: "#BDB3A0", icon: CircleDot },
};

const ROW_ICONS = {
  wake: Sun,
  breakfast: Coffee,
  work: Laptop,
  lunch: Utensils,
  commute: Car,
  exercise: Dumbbell,
  dinner: Utensils,
  study: BookOpen,
  hobby: Gamepad2,
  free: Users,
  sleep: Moon,
};

/* --------------------------- sample data builder ---------------------------
 * Times are set to the minute, not snapped to the hour — blocks can start
 * and end anywhere, overlap gaps, or run short/long relative to a clock hour.
 * The final "Sleep" block wraps past midnight (22:30 -> 6:00 next day).
 * ---------------------------------------------------------------------- */

function block(title, category, availability, startTime, endTime, rowIcon) {
  return {
    id: uuidv4(),
    title,
    category,
    availability,
    startTime,
    endTime,
    rowIcon,
  };
}

function t(hour, minute = 0) {
  return { hour, minute };
}

function buildSampleBlocks() {
  return [
    block(
      "Wake up, shower, get ready",
      "personal",
      "flexible",
      t(6, 0),
      t(6, 40),
      "wake"
    ),
    block("Breakfast", "meal", "busy", t(6, 40), t(7, 20), "breakfast"),
    block("Commute to work", "commute", "busy", t(7, 20), t(8, 10), "commute"),
    block(
      "Work \u2013 deep focus",
      "work",
      "busy",
      t(8, 15),
      t(11, 40),
      "work"
    ),
    block(
      "Lunch + short walk",
      "meal",
      "flexible",
      t(11, 40),
      t(12, 30),
      "lunch"
    ),
    block(
      "Work \u2013 meetings / projects",
      "work",
      "busy",
      t(12, 30),
      t(16, 50),
      "work"
    ),
    block("Gym", "exercise", "busy", t(17, 0), t(18, 10), "exercise"),
    block(
      "Dinner + cleanup",
      "meal",
      "flexible",
      t(18, 10),
      t(19, 0),
      "dinner"
    ),
    block("Study", "study", "flexible", t(19, 5), t(20, 0), "study"),
    block(
      "Hobby \u2013 reading, gaming, or writing",
      "hobby",
      "free",
      t(20, 0),
      t(21, 45),
      "hobby"
    ),
    block("Wind down", "personal", "flexible", t(21, 45), t(22, 30), "sleep"),
    block("Sleep", "sleep", "busy", t(22, 30), t(6, 0), "sleep"),
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
// Duration handles blocks that wrap past midnight (endTime <= startTime).
const durationOf = (b) => {
  const start = toMinutes(b.startTime);
  let end = toMinutes(b.endTime);
  if (end <= start) end += 1440;
  return end - start;
};

/* ------------------------------- analysis --------------------------------- */

function analyzeSchedule(blocks) {
  const totalsByCategory = {};
  for (const b of blocks) {
    const mins = durationOf(b);
    totalsByCategory[b.category] = (totalsByCategory[b.category] || 0) + mins;
  }
  const categoryBreakdown = Object.entries(totalsByCategory)
    .map(([category, totalMinutes]) => ({
      category,
      totalMinutes,
      percentageOfDay: (totalMinutes / 1440) * 100,
    }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes);

  const largestCategory = categoryBreakdown.find((c) => c.category !== "other");

  let totalBusyMinutes = 0;
  let totalFlexibleMinutes = 0;
  let totalFreeMinutes = 0;
  for (const b of blocks) {
    const mins = durationOf(b);
    if (b.availability === "busy") totalBusyMinutes += mins;
    else if (b.availability === "flexible") totalFlexibleMinutes += mins;
    else totalFreeMinutes += mins;
  }

  // Free windows: merge contiguous minutes marked as "free" availability
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
    undefined
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

const hoursLabel = (mins) => {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

/* --------------------------------- UI bits --------------------------------- */

function SidebarItem({ icon: Icon, label, active }) {
  return (
    <div
      className='flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer transition-colors'
      style={{
        backgroundColor: active ? "rgba(124,155,196,0.28)" : "transparent",
        color: "#2E3A50",
      }}>
      <Icon size={18} strokeWidth={2} />
      <span style={{ fontFamily: "'Caveat', cursive", fontSize: "20px" }}>
        {label}
      </span>
    </div>
  );
}

function WavyUnderline({ width = 220, color = "#4F6FA8" }) {
  return (
    <svg width={width} height='12' viewBox={`0 0 ${width} 12`} fill='none'>
      <path
        d={`M2 7 Q ${width * 0.15} 1, ${width * 0.3} 7 T ${width * 0.6} 7 T ${
          width * 0.9
        } 7`}
        stroke={color}
        strokeWidth='2.5'
        strokeLinecap='round'
        fill='none'
      />
    </svg>
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

/* ------------------------------ timeline schedule --------------------------
 * Hour marks (6 AM, 7 AM, ...) are reference gridlines only. Every block is
 * positioned and sized in proportion to its real start time and duration,
 * in minutes, so it can start or end at any minute and any length.
 * ---------------------------------------------------------------------- */

const RULER_START_MIN = 6 * 60; // 6:00 AM
const RULER_END_MIN = 24 * 60; // 12:00 AM (midnight)
const RULER_SPAN = RULER_END_MIN - RULER_START_MIN;

function ScheduleTimeline({ blocks }) {
  const hourMarks = [];
  for (let h = 6; h <= 24; h++) hourMarks.push(h);

  // Compute each block's visible slice within the ruler window.
  const positioned = blocks
    .map((b) => {
      const realStart = toMinutes(b.startTime);
      const realEnd = realStart + durationOf(b);
      const clipStart = Math.max(realStart, RULER_START_MIN);
      const clipEnd = Math.min(realEnd, RULER_END_MIN);
      if (clipEnd <= clipStart) return null;
      return {
        block: b,
        topPct: ((clipStart - RULER_START_MIN) / RULER_SPAN) * 100,
        heightPct: ((clipEnd - clipStart) / RULER_SPAN) * 100,
        labelStart: fromMinutes(clipStart),
        labelEnd: fromMinutes(clipEnd),
      };
    })
    .filter(Boolean);

  return (
    <div className='flex-1 relative' style={{ minHeight: 0 }}>
      {/* hour gridlines + labels */}
      {hourMarks.map((h) => {
        const pct = ((h * 60 - RULER_START_MIN) / RULER_SPAN) * 100;
        return (
          <div
            key={h}
            className='absolute left-0 right-0 flex items-start'
            style={{ top: `${pct}%` }}>
            <span
              className='w-[54px] shrink-0 -translate-y-1/2 text-[11px] text-right pr-2'
              style={{
                color: "#8A93A3",
                fontFamily: "'Nunito Sans', sans-serif",
              }}>
              {dayjs()
                .hour(h % 24)
                .minute(0)
                .format("h A")}
            </span>
            <div
              className='flex-1 border-t'
              style={{ borderColor: "rgba(46,58,80,0.1)" }}
            />
          </div>
        );
      })}

      {/* blocks, absolutely positioned by real start time + duration */}
      <div
        className='absolute inset-0'
        style={{ left: "54px", paddingLeft: "12px" }}>
        {positioned.map(
          ({ block: b, topPct, heightPct, labelStart, labelEnd }) => {
            const meta = CATEGORY_META[b.category];
            const Icon = b.rowIcon ? ROW_ICONS[b.rowIcon] : null;
            const compact = heightPct < 3.2;
            return (
              <div
                key={b.id}
                className='absolute left-3 right-0 rounded-lg border overflow-hidden'
                style={{
                  top: `${topPct}%`,
                  height: `${heightPct}%`,
                  backgroundColor:
                    meta.color + (b.category === "other" ? "30" : "70"),
                  borderColor: meta.color,
                  minHeight: "20px",
                }}>
                <div
                  className={`flex items-center h-full gap-2 px-2.5 ${
                    compact ? "py-0" : "py-1.5"
                  }`}>
                  <div className='flex-1 min-w-0'>
                    {!compact && (
                      <div
                        className='text-[10.5px] tabular-nums truncate'
                        style={{
                          color: "#4A5568",
                          fontFamily: "'Nunito Sans', sans-serif",
                        }}>
                        {fmtTime(labelStart)} {"\u2013"} {fmtTime(labelEnd)}
                      </div>
                    )}
                    <div
                      className='text-[12.5px] truncate'
                      style={{
                        color: "#2E3A50",
                        fontFamily: "'Nunito Sans', sans-serif",
                        fontWeight: 600,
                      }}>
                      {b.title}
                    </div>
                  </div>
                  {Icon && !compact && (
                    <div className='shrink-0 opacity-70'>
                      <Icon size={15} strokeWidth={2} color='#2E3A50' />
                    </div>
                  )}
                  {!compact && b.category !== "other" && (
                    <div className='shrink-0 opacity-40'>
                      <MoreVertical size={14} color='#2E3A50' />
                    </div>
                  )}
                </div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}

/* ---------------------------- overview + allocation ------------------------- */

function OverviewBar({ blocks }) {
  const groups = [];
  for (const b of blocks) {
    const last = groups[groups.length - 1];
    if (last && last.category === b.category) last.minutes += durationOf(b);
    else groups.push({ category: b.category, minutes: durationOf(b) });
  }
  return (
    <div>
      <div
        className='flex w-full h-8 rounded-md overflow-hidden border'
        style={{ borderColor: "rgba(46,58,80,0.15)" }}>
        {blocks.map((b) => (
          <div
            key={b.id}
            style={{
              flexGrow: durationOf(b),
              flexBasis: 0,
              backgroundColor: CATEGORY_META[b.category].color,
              borderRight: "1px solid rgba(255,255,255,0.35)",
            }}
          />
        ))}
      </div>
      <div className='flex mt-1.5 text-[10.5px]' style={{ color: "#6B7280" }}>
        {["12 AM", "6 AM", "12 PM", "6 PM", "12 AM"].map((lbl, i) => (
          <div
            key={i}
            className='flex-1 text-center first:text-left last:text-right'>
            {lbl}
          </div>
        ))}
      </div>
      <div className='flex mt-2.5'>
        {groups.map((g, i) => (
          <div
            key={i}
            style={{ flexGrow: g.minutes, flexBasis: 0 }}
            className='text-center px-0.5'>
            <div
              style={{
                fontFamily: "'Caveat', cursive",
                fontSize: "15px",
                color: "#2E3A50",
              }}>
              {CATEGORY_META[g.category].label.split(" ")[0]}
            </div>
            <div className='text-[10.5px]' style={{ color: "#6B7280" }}>
              {hoursLabel(g.minutes)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AllocationRow({ summary }) {
  const meta = CATEGORY_META[summary.category];
  return (
    <div className='flex items-center gap-2.5'>
      <span
        className='w-2.5 h-2.5 rounded-full shrink-0'
        style={{ backgroundColor: meta.color }}
      />
      <span
        className='w-[118px] shrink-0 text-[12.5px] truncate'
        style={{
          color: "#2E3A50",
          fontFamily: "'Nunito Sans', sans-serif",
          fontWeight: 600,
        }}>
        {meta.label}
      </span>
      <div
        className='flex-1 h-2.5 rounded-full overflow-hidden'
        style={{ backgroundColor: "#DED6C3" }}>
        <div
          className='h-full rounded-full'
          style={{
            width: `${summary.percentageOfDay}%`,
            backgroundColor: meta.color,
          }}
        />
      </div>
      <span
        className='w-11 text-right text-[12px] tabular-nums'
        style={{ color: "#4A5568" }}>
        {hoursLabel(summary.totalMinutes)}
      </span>
      <span
        className='w-9 text-right text-[12px] tabular-nums'
        style={{ color: "#4A5568" }}>
        {Math.round(summary.percentageOfDay)}%
      </span>
    </div>
  );
}

function InsightRow({ icon: Icon, heading, detail }) {
  return (
    <div className='flex items-start gap-2.5'>
      <div className='mt-0.5 shrink-0' style={{ color: "#2E3A50" }}>
        <Icon size={17} strokeWidth={2} />
      </div>
      <div>
        <div
          className='text-[11.5px]'
          style={{ color: "#6B7280", fontFamily: "'Nunito Sans', sans-serif" }}>
          {heading}
        </div>
        <div
          className='inline-block px-1.5 rounded text-[12.5px] mt-0.5'
          style={{
            backgroundColor: "#F3D98A88",
            color: "#2E3A50",
            fontFamily: "'Nunito Sans', sans-serif",
            fontWeight: 700,
          }}>
          {detail}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- main app --------------------------------- */

export default function DailySchedulePlanner() {
  const [date, setDate] = useState(dayjs("2025-04-22"));
  const blocks = useMemo(() => buildSampleBlocks(), []);
  const schedule = { date, blocks };
  const analysis = useMemo(() => analyzeSchedule(blocks), [blocks]);

  const work = analysis.categoryBreakdown.find((c) => c.category === "work");
  const sleepBlocks = blocks.filter((b) => b.category === "sleep");

  const workBlocks = blocks.filter((b) => b.category === "work");
  const workFirstStart = workBlocks.length
    ? workBlocks.reduce((a, b) =>
        toMinutes(a.startTime) < toMinutes(b.startTime) ? a : b
      )
    : null;
  const workLastEnd = workBlocks.length
    ? workBlocks.reduce((a, b) =>
        toMinutes(a.endTime) > toMinutes(b.endTime) ? a : b
      )
    : null;
  const freeFromWorkMinutes =
    workFirstStart && workLastEnd
      ? 1440 -
        (toMinutes(workLastEnd.endTime) - toMinutes(workFirstStart.startTime))
      : 0;

  const totalMinutesForCategory = (cat) =>
    blocks
      .filter((b) => b.category === cat)
      .reduce((sum, b) => sum + durationOf(b), 0);

  return (
    <div
      className='w-full min-h-screen flex'
      style={{
        backgroundColor: "#E8E1CE",
        fontFamily: "'Nunito Sans', sans-serif",
      }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&family=Nunito+Sans:wght@400;600;700;800&display=swap');
      `}</style>

      {/* Sidebar: fixed ~230px */}
      <aside
        className='shrink-0 hidden md:flex flex-col justify-between py-8 px-5'
        style={{
          width: "230px",
          backgroundColor: "#EFE9D8",
          borderRight: "1px solid rgba(46,58,80,0.1)",
        }}>
        <div>
          <div
            className='mb-8 px-1'
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: "26px",
              color: "#2E3A50",
              fontWeight: 700,
            }}>
            My Planner
          </div>
          <nav className='flex flex-col gap-1'>
            <SidebarItem icon={Home} label='Home' />
            <SidebarItem icon={Calendar} label='Schedule' active />
            <SidebarItem icon={CheckSquare} label='Tasks' />
            <SidebarItem icon={Target} label='Goals' />
            <SidebarItem icon={BookOpen} label='Notes' />
          </nav>
        </div>
        <div className='px-1'>
          <div className='mb-3'>
            <svg width='26' height='52' viewBox='0 0 30 60' fill='none'>
              <path d='M15 58 V10' stroke='#8B9AAE' strokeWidth='1.5' />
              <path
                d='M15 20 Q22 14 26 6'
                stroke='#8B9AAE'
                strokeWidth='1.5'
                fill='none'
              />
              <path
                d='M15 32 Q6 26 3 18'
                stroke='#8B9AAE'
                strokeWidth='1.5'
                fill='none'
              />
            </svg>
          </div>
          <p
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: "18px",
              color: "#2E3A50",
              lineHeight: 1.25,
            }}>
            "A more intentional day a brighter tomorrow."
          </p>
        </div>
      </aside>

      {/* Content: schedule column (~800fr) + right column (~890fr) */}
      <main className='flex-1 min-w-0 p-6 md:p-8'>
        <div
          className='grid'
          style={{
            gridTemplateColumns: "800fr 890fr",
            columnGap: "24px",
            rowGap: "16px",
          }}>
          {/* Row 1, Col 1: Title */}
          <div>
            <h1
              style={{
                fontFamily: "'Caveat', cursive",
                fontSize: "40px",
                color: "#2E3A50",
                fontWeight: 700,
              }}>
              Daily Schedule
            </h1>
            <div className='-mt-2 mb-1'>
              <WavyUnderline />
            </div>
            <p className='text-[13.5px] italic' style={{ color: "#4A5568" }}>
              "A productive day is a collection of intentional choices."
            </p>
          </div>

          {/* Row 1, Col 2: Date / Controls */}
          <div className='flex items-center justify-between gap-3'>
            <div
              className='flex items-center gap-2 px-3 py-2 rounded-lg border'
              style={{
                backgroundColor: "#F6F2E6",
                borderColor: "rgba(46,58,80,0.15)",
              }}>
              <button
                onClick={() => setDate((d) => d.subtract(1, "day"))}
                aria-label='Previous day'
                className='p-0.5 rounded hover:bg-black/5'>
                <ChevronLeft size={16} color='#2E3A50' />
              </button>
              <span
                className='text-[13.5px] px-1 tabular-nums'
                style={{ color: "#2E3A50", fontWeight: 700 }}>
                {date.format("ddd, MMM D, YYYY")}
              </span>
              <button
                onClick={() => setDate((d) => d.add(1, "day"))}
                aria-label='Next day'
                className='p-0.5 rounded hover:bg-black/5'>
                <ChevronRight size={16} color='#2E3A50' />
              </button>
            </div>
            <div
              className='p-2.5 rounded-lg border'
              style={{
                backgroundColor: "#F6F2E6",
                borderColor: "rgba(46,58,80,0.15)",
              }}>
              <CalendarDays size={16} color='#2E3A50' />
            </div>
            <div
              className='hidden lg:flex flex-col items-center justify-center rotate-[3deg] px-2.5 py-1.5 rounded-sm shadow-sm shrink-0'
              style={{ backgroundColor: "#F3D98A" }}>
              <span
                style={{
                  fontFamily: "'Caveat', cursive",
                  fontSize: "14px",
                  color: "#4A3B1D",
                  lineHeight: 1.1,
                }}>
                Same plan.
              </span>
              <span
                style={{
                  fontFamily: "'Caveat', cursive",
                  fontSize: "14px",
                  color: "#4A3B1D",
                  lineHeight: 1.1,
                }}>
                A better you.
              </span>
            </div>
          </div>

          {/* Rows 2-4, Col 1: Schedule timeline (minute-precision, spans full right-column height) */}
          <Panel
            style={{
              gridRow: "span 3",
              display: "flex",
              flexDirection: "column",
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

          {/* Row 2, Col 2: 24-Hour Overview */}
          <Panel>
            <h2
              className='mb-3'
              style={{
                fontFamily: "'Caveat', cursive",
                fontSize: "22px",
                color: "#2E3A50",
              }}>
              24-Hour Overview
            </h2>
            <OverviewBar blocks={blocks} />
          </Panel>

          {/* Row 3, Col 2: Time Allocation */}
          <Panel>
            <h2
              className='mb-3'
              style={{
                fontFamily: "'Caveat', cursive",
                fontSize: "22px",
                color: "#2E3A50",
              }}>
              Time Allocation
            </h2>
            <div className='flex flex-col gap-2.5'>
              {analysis.categoryBreakdown.map((s) => (
                <AllocationRow key={s.category} summary={s} />
              ))}
            </div>
          </Panel>

          {/* Row 4, Col 2: Insights | Notes side by side */}
          <div
            className='grid'
            style={{ gridTemplateColumns: "3fr 2fr", columnGap: "16px" }}>
            <Panel>
              <h2
                className='mb-3'
                style={{
                  fontFamily: "'Caveat', cursive",
                  fontSize: "20px",
                  color: "#2E3A50",
                }}>
                Key Insights
              </h2>
              <div className='flex flex-col gap-3'>
                {work && (
                  <InsightRow
                    icon={BarChart3}
                    heading='Largest time commitment'
                    detail={`${
                      CATEGORY_META[work.category].label
                    } (${hoursLabel(work.totalMinutes)}, ${Math.round(
                      work.percentageOfDay
                    )}%)`}
                  />
                )}
                {workFirstStart && workLastEnd && (
                  <InsightRow
                    icon={Clock}
                    heading='Free from work'
                    detail={`${fmtTime(workLastEnd.endTime)} \u2013 ${fmtTime(
                      workFirstStart.startTime
                    )} (${hoursLabel(freeFromWorkMinutes)})`}
                  />
                )}
                {analysis.longestFreeWindow && (
                  <InsightRow
                    icon={Star}
                    heading='Longest free block'
                    detail={`${hoursLabel(
                      analysis.longestFreeWindow.durationMinutes
                    )} (${fmtTime(
                      analysis.longestFreeWindow.startTime
                    )} \u2013 ${fmtTime(analysis.longestFreeWindow.endTime)})`}
                  />
                )}
                {sleepBlocks.length > 0 && (
                  <InsightRow
                    icon={Moon}
                    heading='Sleep schedule'
                    detail={`${fmtTime(
                      sleepBlocks[0].startTime
                    )} \u2013 ${fmtTime(sleepBlocks[0].endTime)} (${hoursLabel(
                      totalMinutesForCategory("sleep")
                    )})`}
                  />
                )}
              </div>
            </Panel>

            <Panel style={{ position: "relative" }}>
              <div
                className='absolute -top-2 right-6 w-12 h-5 rotate-[6deg]'
                style={{ backgroundColor: "#9FC3DEaa" }}
              />
              <h2
                className='mb-3'
                style={{
                  fontFamily: "'Caveat', cursive",
                  fontSize: "20px",
                  color: "#2E3A50",
                }}>
                Notes
              </h2>
              <ul className='flex flex-col gap-2 mb-3'>
                {[
                  "Stay consistent",
                  "Make time for what I enjoy",
                  "Small progress adds up!",
                ].map((n) => (
                  <li key={n} className='flex items-center gap-2'>
                    <span
                      className='w-3.5 h-3.5 rounded-sm border shrink-0'
                      style={{ borderColor: "#2E3A50" }}
                    />
                    <span
                      className='text-[12.5px]'
                      style={{ color: "#2E3A50" }}>
                      {n}
                    </span>
                  </li>
                ))}
              </ul>
              <p
                style={{
                  fontFamily: "'Caveat', cursive",
                  fontSize: "16px",
                  color: "#2E3A50",
                  lineHeight: 1.3,
                }}>
                A well-planned day leads to a calmer mind.
              </p>
            </Panel>
          </div>
        </div>
      </main>
    </div>
  );
}
