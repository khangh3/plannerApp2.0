import type { LucideIcon } from "lucide-react";
import { FONT } from "../styles";

function InsightCard({
  icon: Icon,
  label,
  value,
  caption,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  caption: string;
}) {
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

export default InsightCard;
