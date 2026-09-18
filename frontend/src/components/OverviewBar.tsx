import { FONT, CATEGORY_META, GROUP_META, GROUP_ORDER } from "../styles";
import type { scheduleBlock } from "../types/schedule";
import { durationOf } from "../utility/time";

function OverviewBar({ blocks }: { blocks: scheduleBlock[] }) {
  return (
    <div>
      <div
        className='flex w-full h-8 rounded-md overflow-hidden border'
        style={{ borderColor: "rgba(90,66,46,0.2)" }}>
        {blocks.map((b) => (
          <div
            key={b.id}
            style={{
              flexGrow: durationOf(b.startTime, b.endTime),
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

export default OverviewBar;
