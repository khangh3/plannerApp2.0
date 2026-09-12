import { useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CalendarDays,
  User,
  Sun,
  Clock,
} from "lucide-react";
import { mockDailySchedule } from "./mockData";
import ScheduleColumn from "./components/ScheduleColumn";
import ScheduleBlockModal from "./components/ScheduleBlockModal";
import Panel from "./components/Panel";
import OverviewBar from "./components/OverviewBar";
import AllocationRow from "./components/AllocationRow";
import InsightCard from "./components/InsightCard";
import type { scheduleBlock } from "./types/schedule";
import { FONT, GROUP_META } from "./styles";
import { fmtTime, hoursLabel } from "./utility/time";
import { analyzeSchedule, groupBreakdown } from "./utility/scheduleAnalysis";

/* --------------------------------- main app --------------------------------- */

export default function DailySchedulePlanner() {
  const [date, setDate] = useState(dayjs("2024-04-23"));
  const [viewMode, setViewMode] = useState("day");
  const [blocks, setBlocks] = useState<scheduleBlock[]>(
    mockDailySchedule.blocks,
  );
  const [modalState, setModalState] = useState<{
    mode: "create" | "edit";
    block?: scheduleBlock;
  } | null>(null);

  const openCreateModal = () => setModalState({ mode: "create" });
  const openEditModal = (id: string) => {
    const block = blocks.find((b) => b.id === id);
    if (block) setModalState({ mode: "edit", block });
  };
  const closeModal = () => setModalState(null);
  const handleSaveBlock = (block: scheduleBlock) => {
    setBlocks((prev) =>
      modalState?.mode === "edit"
        ? prev.map((b) => (b.id === block.id ? block : b))
        : [...prev, block],
    );
    closeModal();
  };
  const handleDeleteBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    closeModal();
  };

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
            <button
              onClick={openCreateModal}
              className='px-4 py-2 rounded-lg text-[13px] font-bold'
              style={{
                backgroundColor: "#A9C7E8",
                color: "#3B2C20",
                fontFamily: FONT,
              }}>
              + Create Time Block
            </button>
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
          style={{ gridTemplateColumns: "1fr 1fr 1.2fr" }}>
          <Panel style={{ minHeight: "780px" }}>
            <ScheduleColumn
              label='12 AM - 12 PM'
              windowStart={0}
              windowEnd={720}
              blocks={blocks}
              onBlockClick={openEditModal}
            />
          </Panel>

          <Panel style={{ minHeight: "780px" }}>
            <ScheduleColumn
              label='12 PM - 12 AM'
              windowStart={720}
              windowEnd={1440}
              blocks={blocks}
              onBlockClick={openEditModal}
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

      <ScheduleBlockModal
        isOpen={modalState !== null}
        mode={modalState?.mode ?? "create"}
        initialBlock={modalState?.block}
        existingBlocks={blocks}
        onSave={handleSaveBlock}
        onDelete={handleDeleteBlock}
        onClose={closeModal}
      />
    </div>
  );
}
