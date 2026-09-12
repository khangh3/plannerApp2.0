import { FONT, GROUP_META } from "../styles";
import type { groupSummary } from "../utility/scheduleAnalysis";
import { hoursLabel } from "../utility/time";

function AllocationRow({ summary }: { summary: groupSummary }) {
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

export default AllocationRow;
