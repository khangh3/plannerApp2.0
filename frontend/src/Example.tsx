import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { v4 as uuid } from "uuid";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Pencil,
  Bed,
  Briefcase,
  Car,
  UtensilsCrossed,
  Dumbbell,
  BookOpen,
  Gamepad2,
  User,
  Sparkles,
  Circle,
  BarChart3,
  Clock,
  Star,
  Moon,
  Feather,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Paper / journal type system
// ---------------------------------------------------------------------------

const FONT_SERIF = {
  fontFamily: "'Libre Baskerville', Georgia, 'Times New Roman', serif",
};
const FONT_HAND = { fontFamily: "'Caveat', cursive" };
const FONT_TYPE = { fontFamily: "'Special Elite', 'Courier New', monospace" };

const INK = "#2E2A24";
const INK_SOFT = "#6B6153";
const PAPER = "#F3EAD6";
const PAPER_CARD = "#FBF5E7";
const RULE = "#D9C9A3";

/**
 * ---- Types (documented in comments; this file is plain JS/JSX) ----
 *
 * ActivityCategory: "sleep" | "work" | "commute" | "meal" | "exercise"
 *   | "study" | "hobby" | "personal" | "free" | "other"
 * Availability: "busy" | "flexible" | "free"
 * TimeOfDay: { hour: number, minute: number }
 * ScheduleBlock: { id, title, description?, category, availability, startTime, endTime }
 * DailySchedule: { date: Dayjs, blocks: ScheduleBlock[] }
 * CategorySummary: { category, totalMinutes, percentageOfDay }
 * TimeWindow: { startTime, endTime, durationMinutes }
 * ScheduleAnalysis: {
 *   categoryBreakdown, freeWindows, longestFreeWindow?, largestCategory?,
 *   totalBusyMinutes, totalFlexibleMinutes, totalFreeMinutes
 * }
 */

// ---------------------------------------------------------------------------
// Category presentation metadata
// ---------------------------------------------------------------------------

const CATEGORY_META = {
  sleep: { label: "Sleep", color: "#3F5372", icon: Bed },
  work: { label: "Work", color: "#4B7355", icon: Briefcase },
  commute: { label: "Commute", color: "#7891AC", icon: Car },
  meal: { label: "Meals", color: "#B8912E", icon: UtensilsCrossed },
  exercise: { label: "Exercise", color: "#A85138", icon: Dumbbell },
  study: { label: "Study", color: "#6E4F79", icon: BookOpen },
  hobby: { label: "Hobby", color: "#5B3E78", icon: Gamepad2 },
  personal: { label: "Personal", color: "#B98A82", icon: User },
  free: { label: "Free Time", color: "#7C9473", icon: Sparkles },
  other: { label: "Other", color: "#8B8378", icon: Circle },
};

// Groupings used for the four top-level summary cards.
const SUMMARY_GROUPS = [
  {
    key: "sleep",
    label: "Sleep",
    categories: ["sleep"],
    icon: Bed,
    color: "#3F5372",
    rotate: -1.5,
  },
  {
    key: "work",
    label: "Work Related",
    categories: ["work", "commute"],
    icon: Briefcase,
    color: "#4B7355",
    rotate: 1,
  },
  {
    key: "personal",
    label: "Personal / Other",
    categories: ["meal", "study", "exercise", "personal", "other"],
    icon: User,
    color: "#A85138",
    rotate: -1,
  },
  {
    key: "free",
    label: "Free Time",
    categories: ["hobby", "free"],
    icon: Gamepad2,
    color: "#5B3E78",
    rotate: 1.5,
  },
];

// ---------------------------------------------------------------------------
// Time helpers
// ---------------------------------------------------------------------------

const toMinutes = (t) => t.hour * 60 + t.minute;

const formatTime = (t) => {
  const d = dayjs().hour(t.hour).minute(t.minute).second(0);
  return d.format("h:mm A");
};

const formatDuration = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
};

// ---------------------------------------------------------------------------
// Sample data — conforms to DailySchedule
// ---------------------------------------------------------------------------

const block = (
  title,
  description,
  category,
  availability,
  [sh, sm],
  [eh, em]
) => ({
  id: uuid(),
  title,
  description,
  category,
  availability,
  startTime: { hour: sh, minute: sm },
  endTime: { hour: eh, minute: em },
});

const sampleSchedule = {
  date: dayjs("2025-04-22"),
  blocks: [
    block("Sleep", "Rest and recharge", "sleep", "busy", [0, 0], [6, 0]),
    block(
      "Morning Routine",
      "Wake up, shower, get ready",
      "personal",
      "busy",
      [6, 0],
      [7, 0]
    ),
    block(
      "Breakfast & Commute",
      "Eat breakfast and commute to work",
      "commute",
      "busy",
      [7, 0],
      [8, 0]
    ),
    block("Work", "Focused work time", "work", "busy", [8, 0], [12, 0]),
    block(
      "Lunch",
      "Eat lunch and short walk",
      "meal",
      "flexible",
      [12, 0],
      [13, 0]
    ),
    block("Work", "Meetings and projects", "work", "busy", [13, 0], [17, 0]),
    block("Exercise", "Gym workout", "exercise", "flexible", [17, 0], [18, 0]),
    block(
      "Dinner",
      "Cook and eat dinner, cleanup",
      "meal",
      "flexible",
      [18, 0],
      [19, 0]
    ),
    block(
      "Study",
      "Learn or skill-building",
      "study",
      "flexible",
      [19, 0],
      [20, 0]
    ),
    block(
      "Hobby",
      "Reading, gaming, or personal projects",
      "hobby",
      "free",
      [20, 0],
      [22, 0]
    ),
    block(
      "Free Time",
      "Relax, friends, entertainment",
      "free",
      "free",
      [22, 0],
      [23, 0]
    ),
    block(
      "Wind Down",
      "Prepare for tomorrow",
      "personal",
      "flexible",
      [23, 0],
      [24, 0]
    ),
  ],
};

// ---------------------------------------------------------------------------
// Analysis — DailySchedule -> ScheduleAnalysis
// ---------------------------------------------------------------------------

function computeScheduleAnalysis(schedule) {
  const TOTAL = 24 * 60;
  const byCategory = {};
  let totalBusyMinutes = 0;
  let totalFlexibleMinutes = 0;
  let totalFreeMinutes = 0;

  const freeBlocks = [];

  for (const b of schedule.blocks) {
    const duration = toMinutes(b.endTime) - toMinutes(b.startTime);
    byCategory[b.category] = (byCategory[b.category] || 0) + duration;

    if (b.availability === "busy") totalBusyMinutes += duration;
    else if (b.availability === "flexible") totalFlexibleMinutes += duration;
    else totalFreeMinutes += duration;

    if (b.availability === "free") freeBlocks.push(b);
  }

  const categoryBreakdown = Object.entries(byCategory)
    .map(([category, totalMinutes]) => ({
      category,
      totalMinutes,
      percentageOfDay: (totalMinutes / TOTAL) * 100,
    }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes);

  // Merge contiguous "free" blocks into windows.
  const sortedFree = [...freeBlocks].sort(
    (a, b) => toMinutes(a.startTime) - toMinutes(b.startTime)
  );
  const freeWindows = [];
  for (const b of sortedFree) {
    const last = freeWindows[freeWindows.length - 1];
    if (last && toMinutes(last.endTime) === toMinutes(b.startTime)) {
      last.endTime = b.endTime;
      last.durationMinutes =
        toMinutes(last.endTime) - toMinutes(last.startTime);
    } else {
      freeWindows.push({
        startTime: b.startTime,
        endTime: b.endTime,
        durationMinutes: toMinutes(b.endTime) - toMinutes(b.startTime),
      });
    }
  }

  const longestFreeWindow = freeWindows.reduce(
    (max, w) => (!max || w.durationMinutes > max.durationMinutes ? w : max),
    undefined
  );

  const largestCategory = categoryBreakdown[0];

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

function summarizeGroups(analysis) {
  const byCat = Object.fromEntries(
    analysis.categoryBreakdown.map((c) => [c.category, c])
  );
  return SUMMARY_GROUPS.map((g) => {
    const totalMinutes = g.categories.reduce(
      (sum, c) => sum + (byCat[c]?.totalMinutes || 0),
      0
    );
    return {
      ...g,
      totalMinutes,
      percentageOfDay: (totalMinutes / (24 * 60)) * 100,
    };
  });
}

// Last work block end -> next day's first work block start (free-from-work span)
function freeFromWorkWindow(schedule) {
  const workBlocks = schedule.blocks.filter((b) => b.category === "work");
  if (workBlocks.length === 0) return null;
  const lastEnd = workBlocks.reduce(
    (max, b) => (toMinutes(b.endTime) > toMinutes(max.endTime) ? b : max),
    workBlocks[0]
  ).endTime;
  const firstStart = workBlocks.reduce(
    (min, b) => (toMinutes(b.startTime) < toMinutes(min.startTime) ? b : min),
    workBlocks[0]
  ).startTime;
  const minutes = 24 * 60 - toMinutes(lastEnd) + toMinutes(firstStart);
  return { start: lastEnd, end: firstStart, minutes };
}

// ---------------------------------------------------------------------------
// Small presentational pieces — paper / journal styling
// ---------------------------------------------------------------------------

// A little strip of "washi tape" — used to pin cards to the page.
function Tape({ color = "#C9B37E", rotate = -3, style = {} }) {
  return (
    <div
      className='absolute -top-3 left-1/2 h-5 w-16'
      style={{
        backgroundColor: color,
        opacity: 0.55,
        transform: `translateX(-50%) rotate(${rotate}deg)`,
        boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
        ...style,
      }}
    />
  );
}

function StatCard({ icon: Icon, color, value, label, sub, rotate }) {
  return (
    <div
      className='relative border border-dashed p-4'
      style={{
        backgroundColor: PAPER_CARD,
        borderColor: RULE,
        transform: `rotate(${rotate}deg)`,
        boxShadow: "2px 3px 6px rgba(60,45,20,0.12)",
      }}>
      <Tape color={color} rotate={rotate < 0 ? 4 : -4} />
      <div className='flex items-center gap-3'>
        <div
          className='flex h-10 w-10 shrink-0 items-center justify-center border'
          style={{
            borderColor: color,
            color,
            borderRadius: "48% 52% 46% 54% / 54% 48% 52% 46%",
          }}>
          <Icon size={18} strokeWidth={2} />
        </div>
        <div className='min-w-0'>
          <div
            className='text-2xl font-bold leading-tight'
            style={{ ...FONT_SERIF, color: INK }}>
            {value}
          </div>
          <div className='truncate text-sm' style={{ color: INK_SOFT }}>
            {label}
          </div>
        </div>
      </div>
      <div
        className='mt-1 text-right text-xs italic'
        style={{ ...FONT_HAND, color, fontSize: "1rem" }}>
        {sub}
      </div>
    </div>
  );
}

function TimelineBar({ blocks }) {
  const TOTAL = 24 * 60;
  const hourMarks = [0, 3, 6, 9, 12, 15, 18, 21, 24];

  return (
    <div>
      <div
        className='flex h-12 w-full overflow-hidden border'
        style={{ borderColor: INK, borderRadius: "2px" }}>
        {blocks.map((b) => {
          const duration = toMinutes(b.endTime) - toMinutes(b.startTime);
          const widthPct = (duration / TOTAL) * 100;
          const meta = CATEGORY_META[b.category];
          const showLabel = widthPct >= 6;
          return (
            <div
              key={b.id}
              title={`${b.title} · ${formatTime(b.startTime)}–${formatTime(
                b.endTime
              )}`}
              className='flex h-full items-center justify-center overflow-hidden border-r border-dashed last:border-r-0'
              style={{
                width: `${widthPct}%`,
                backgroundColor: meta.color,
                borderColor: "rgba(255,255,255,0.4)",
              }}>
              {showLabel && (
                <span
                  className='truncate px-1 text-xs'
                  style={{ ...FONT_TYPE, color: "#F6EFDD" }}>
                  {b.title}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div
        className='mt-2 flex justify-between text-xs'
        style={{ ...FONT_TYPE, color: INK_SOFT }}>
        {hourMarks.map((h) => (
          <span key={h}>
            {h === 0 || h === 24
              ? "12 AM"
              : h === 12
              ? "12 PM"
              : h < 12
              ? `${h} AM`
              : `${h - 12} PM`}
          </span>
        ))}
      </div>
    </div>
  );
}

function ScheduleRow({ b }) {
  const meta = CATEGORY_META[b.category];
  return (
    <div
      className='flex gap-4 py-3.5'
      style={{ borderBottom: `1px dotted ${RULE}` }}>
      <div className='flex w-28 shrink-0 items-start gap-2 pt-0.5'>
        <span
          className='mt-1.5 h-2.5 w-2.5 shrink-0 border'
          style={{
            backgroundColor: meta.color,
            borderColor: INK,
            borderRadius: "48% 52% 46% 54% / 54% 48% 52% 46%",
          }}
        />
        <span
          className='text-xs leading-tight'
          style={{ ...FONT_TYPE, color: INK_SOFT }}>
          {formatTime(b.startTime)}
          <br />
          {formatTime(b.endTime)}
        </span>
      </div>
      <div className='min-w-0'>
        <div
          className='text-base font-bold'
          style={{ ...FONT_SERIF, color: INK }}>
          {b.title}
        </div>
        {b.description && (
          <div className='truncate text-sm italic' style={{ color: INK_SOFT }}>
            {b.description}
          </div>
        )}
      </div>
    </div>
  );
}

function AllocationRow({ category, totalMinutes, percentageOfDay }) {
  const meta = CATEGORY_META[category];
  return (
    <div className='flex items-center gap-3 py-2'>
      <span
        className='h-2.5 w-2.5 shrink-0 border'
        style={{
          backgroundColor: meta.color,
          borderColor: INK,
          borderRadius: "48% 52% 46% 54% / 54% 48% 52% 46%",
        }}
      />
      <span
        className='w-24 shrink-0 truncate text-sm'
        style={{ ...FONT_SERIF, color: INK }}>
        {meta.label}
      </span>
      <div
        className='h-3 flex-1 border'
        style={{ borderColor: INK_SOFT, backgroundColor: "rgba(0,0,0,0.03)" }}>
        <div
          className='h-full'
          style={{ width: `${percentageOfDay}%`, backgroundColor: meta.color }}
        />
      </div>
      <span
        className='w-12 shrink-0 text-right text-xs'
        style={{ ...FONT_TYPE, color: INK }}>
        {formatDuration(totalMinutes)}
      </span>
      <span
        className='w-9 shrink-0 text-right text-xs'
        style={{ ...FONT_TYPE, color: INK_SOFT }}>
        {Math.round(percentageOfDay)}%
      </span>
    </div>
  );
}

function InsightRow({ icon: Icon, color, label, value }) {
  return (
    <div
      className='flex items-start gap-3 py-2.5'
      style={{ borderBottom: `1px dotted ${RULE}` }}>
      <div
        className='mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border'
        style={{ borderColor: color, color }}>
        <Icon size={15} strokeWidth={2} />
      </div>
      <div className='min-w-0'>
        <div className='text-xs italic' style={{ color: INK_SOFT }}>
          {label}
        </div>
        <div
          className='text-sm font-bold'
          style={{ ...FONT_SERIF, color: INK }}>
          {value}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function DailyScheduleDashboard() {
  const [schedule] = useState(sampleSchedule);
  const analysis = useMemo(() => computeScheduleAnalysis(schedule), [schedule]);
  const summaryGroups = useMemo(() => summarizeGroups(analysis), [analysis]);
  const freeFromWork = useMemo(() => freeFromWorkWindow(schedule), [schedule]);

  const sortedBlocks = [...schedule.blocks].sort(
    (a, b) => toMinutes(a.startTime) - toMinutes(b.startTime)
  );

  return (
    <div
      className='min-h-screen p-4 sm:p-8'
      style={{
        backgroundColor: "#E4DCC8",
        backgroundImage:
          "radial-gradient(circle at 15% 10%, rgba(120,90,50,0.06), transparent 40%), radial-gradient(circle at 85% 90%, rgba(120,90,50,0.05), transparent 40%)",
      }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Caveat:wght@500;700&family=Special+Elite&display=swap');
      `}</style>

      <div
        className='relative mx-auto max-w-6xl'
        style={{
          backgroundColor: PAPER,
          backgroundImage:
            "repeating-linear-gradient(rgba(90,70,40,0.05) 0px, rgba(90,70,40,0.05) 1px, transparent 1px, transparent 30px)",
          boxShadow: "0 10px 30px rgba(50,35,15,0.25)",
          borderRadius: "3px",
        }}>
        {/* spiral binding */}
        <div
          className='absolute left-0 top-6 bottom-6 hidden w-8 sm:block'
          style={{
            backgroundImage:
              "repeating-radial-gradient(circle at 16px 14px, #C9BC9C 0px, #C9BC9C 5px, transparent 6px, transparent 32px)",
            backgroundSize: "32px 32px",
            backgroundRepeat: "repeat-y",
          }}
        />

        <div className='space-y-6 p-5 pl-5 sm:p-10 sm:pl-14'>
          {/* Header */}
          <div
            className='flex flex-wrap items-end justify-between gap-4 border-b-2 pb-5'
            style={{ borderColor: INK }}>
            <div className='flex items-center gap-3'>
              <Feather size={26} style={{ color: INK }} strokeWidth={1.75} />
              <div>
                <h1
                  className='text-3xl'
                  style={{ ...FONT_SERIF, fontWeight: 700, color: INK }}>
                  Daily Planner
                </h1>
                <p
                  className='text-2xl leading-none'
                  style={{ ...FONT_HAND, color: "#A8402E" }}>
                  {schedule.date.format("dddd, MMMM D")}
                </p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <button
                className='flex items-center justify-center border p-2'
                style={{ borderColor: INK, color: INK }}>
                <ChevronLeft size={15} />
              </button>
              <button
                className='border px-3 py-2 text-xs uppercase tracking-wide'
                style={{ ...FONT_TYPE, borderColor: INK, color: INK }}>
                Today
              </button>
              <button
                className='flex items-center justify-center border p-2'
                style={{ borderColor: INK, color: INK }}>
                <ChevronRight size={15} />
              </button>
              <button
                className='flex items-center gap-2 border px-3 py-2 text-xs'
                style={{ ...FONT_TYPE, borderColor: INK, color: INK }}>
                Weekday (Default)
                <ChevronDown size={13} />
              </button>
            </div>
          </div>

          {/* Stat cards */}
          <div className='grid grid-cols-2 gap-6 pt-2 sm:grid-cols-4'>
            {summaryGroups.map((g) => (
              <StatCard
                key={g.key}
                icon={g.icon}
                color={g.color}
                rotate={g.rotate}
                value={formatDuration(g.totalMinutes)}
                label={g.label}
                sub={`${Math.round(g.percentageOfDay)}% of day`}
              />
            ))}
          </div>

          {/* Timeline */}
          <div className='pt-2'>
            <div className='mb-3 flex flex-wrap items-baseline justify-between gap-2'>
              <h2
                className='text-xl'
                style={{ ...FONT_SERIF, fontWeight: 700, color: INK }}>
                24-Hour Overview
              </h2>
              <span
                className='text-sm italic'
                style={{ ...FONT_HAND, color: INK_SOFT, fontSize: "1.1rem" }}>
                every block, a little of the day
              </span>
            </div>
            <TimelineBar blocks={sortedBlocks} />
          </div>

          {/* Detail + side panels */}
          <div className='grid grid-cols-1 gap-8 pt-2 lg:grid-cols-5'>
            <div className='lg:col-span-3'>
              <div
                className='mb-1 flex items-center justify-between border-b pb-2'
                style={{ borderColor: RULE }}>
                <h2
                  className='text-xl'
                  style={{ ...FONT_SERIF, fontWeight: 700, color: INK }}>
                  Detailed Schedule
                </h2>
                <button
                  className='flex items-center gap-1.5 border px-3 py-1 text-xs'
                  style={{ ...FONT_TYPE, borderColor: INK, color: INK }}>
                  <Pencil size={12} />
                  Edit
                </button>
              </div>
              <div>
                {sortedBlocks.map((b) => (
                  <ScheduleRow key={b.id} b={b} />
                ))}
              </div>
            </div>

            <div className='space-y-8 lg:col-span-2'>
              <div>
                <h2
                  className='mb-2 border-b pb-2 text-xl'
                  style={{
                    ...FONT_SERIF,
                    fontWeight: 700,
                    color: INK,
                    borderColor: RULE,
                  }}>
                  Time Allocation
                </h2>
                {analysis.categoryBreakdown.map((c) => (
                  <AllocationRow key={c.category} {...c} />
                ))}
              </div>

              <div>
                <h2
                  className='mb-1 border-b pb-2 text-xl'
                  style={{
                    ...FONT_SERIF,
                    fontWeight: 700,
                    color: INK,
                    borderColor: RULE,
                  }}>
                  Key Insights
                </h2>
                <div>
                  {analysis.largestCategory && (
                    <InsightRow
                      icon={BarChart3}
                      color='#4B7355'
                      label='Largest time commitment'
                      value={`${
                        CATEGORY_META[analysis.largestCategory.category].label
                      } (${formatDuration(
                        analysis.largestCategory.totalMinutes
                      )}, ${Math.round(
                        analysis.largestCategory.percentageOfDay
                      )}% of day)`}
                    />
                  )}
                  {freeFromWork && (
                    <InsightRow
                      icon={Clock}
                      color='#7891AC'
                      label='Free from work'
                      value={`${formatTime(freeFromWork.start)} – ${formatTime(
                        freeFromWork.end
                      )} (${formatDuration(freeFromWork.minutes)})`}
                    />
                  )}
                  {analysis.longestFreeWindow && (
                    <InsightRow
                      icon={Star}
                      color='#B8912E'
                      label='Longest uninterrupted free block'
                      value={`${formatDuration(
                        analysis.longestFreeWindow.durationMinutes
                      )} (${formatTime(
                        analysis.longestFreeWindow.startTime
                      )} – ${formatTime(analysis.longestFreeWindow.endTime)})`}
                    />
                  )}
                  <InsightRow
                    icon={Moon}
                    color='#3F5372'
                    label='Sleep schedule'
                    value={(() => {
                      const s = schedule.blocks.find(
                        (b) => b.category === "sleep"
                      );
                      return s
                        ? `${formatTime(s.startTime)} – ${formatTime(
                            s.endTime
                          )} (${formatDuration(
                            toMinutes(s.endTime) - toMinutes(s.startTime)
                          )})`
                        : "—";
                    })()}
                  />
                  {analysis.longestFreeWindow && (
                    <InsightRow
                      icon={Calendar}
                      color='#5B3E78'
                      label='True discretionary time'
                      value={`${formatTime(
                        analysis.longestFreeWindow.startTime
                      )} – ${formatTime(
                        analysis.longestFreeWindow.endTime
                      )} (${formatDuration(
                        analysis.longestFreeWindow.durationMinutes
                      )})`}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className='relative mt-4 flex flex-wrap items-center justify-between gap-4 border-t-2 pt-5'
            style={{ borderColor: INK }}>
            <div>
              <div
                className='text-2xl'
                style={{ ...FONT_HAND, color: "#A8402E" }}>
                At a glance —
              </div>
              <div
                className='text-base italic'
                style={{ ...FONT_SERIF, color: INK_SOFT }}>
                A {Math.round((analysis.totalBusyMinutes / (24 * 60)) * 100)}%
                structured day with{" "}
                {formatDuration(
                  schedule.blocks
                    .filter((b) => b.category === "work")
                    .reduce(
                      (s, b) =>
                        s + (toMinutes(b.endTime) - toMinutes(b.startTime)),
                      0
                    )
                )}{" "}
                of work,{" "}
                {formatDuration(
                  schedule.blocks
                    .filter((b) => b.category === "sleep")
                    .reduce(
                      (s, b) =>
                        s + (toMinutes(b.endTime) - toMinutes(b.startTime)),
                      0
                    )
                )}{" "}
                of sleep, and {formatDuration(analysis.totalFreeMinutes)} of
                true free time.
              </div>
            </div>
            <button
              className='flex items-center gap-2 border px-4 py-2 text-xs'
              style={{ ...FONT_TYPE, borderColor: INK, color: INK }}>
              <Pencil size={13} />
              Make Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
