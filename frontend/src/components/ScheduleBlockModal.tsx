import { useEffect, useState } from "react";
import { FONT, CATEGORY_META } from "../styles";
import type {
  activityCategory,
  availability,
  scheduleBlock,
} from "../types/schedule";
import {
  timeOfDayToInputString,
  inputStringToTimeOfDay,
  fmtTime,
} from "../utility/time";
import {
  createScheduleBlock,
  findOverlappingBlock,
  isValidTimeWindow,
} from "../utility/scheduleBlocks";

const CATEGORIES = Object.keys(CATEGORY_META) as activityCategory[];
const AVAILABILITIES: availability[] = ["busy", "flexible"];

const DEFAULT_START = "09:00";
const DEFAULT_END = "10:00";

const label = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

type ScheduleBlockModalProps = {
  mode: "create" | "edit";
  isOpen: boolean;
  initialBlock?: scheduleBlock;
  existingBlocks: scheduleBlock[];
  onSave: (block: scheduleBlock) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onClose: () => void;
};

function ScheduleBlockModal({
  mode,
  isOpen,
  initialBlock,
  existingBlocks,
  onSave,
  onDelete,
  onClose,
}: ScheduleBlockModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<activityCategory>("other");
  const [availabilityValue, setAvailabilityValue] =
    useState<availability>("flexible");
  const [startTimeStr, setStartTimeStr] = useState(DEFAULT_START);
  const [endTimeStr, setEndTimeStr] = useState(DEFAULT_END);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (initialBlock) {
      setTitle(initialBlock.title);
      setDescription(initialBlock.description ?? "");
      setCategory(initialBlock.category);
      setAvailabilityValue(initialBlock.availability);
      setStartTimeStr(timeOfDayToInputString(initialBlock.startTime));
      setEndTimeStr(timeOfDayToInputString(initialBlock.endTime));
    } else {
      setTitle("");
      setDescription("");
      setCategory("other");
      setAvailabilityValue("flexible");
      setStartTimeStr(DEFAULT_START);
      setEndTimeStr(DEFAULT_END);
    }
    setError(null);
    setIsSaving(false);
  }, [isOpen, initialBlock]);

  if (!isOpen) return null;

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Title is required");
      return;
    }

    // constraints
    const startTime = inputStringToTimeOfDay(startTimeStr);
    const endTime = inputStringToTimeOfDay(endTimeStr);

    if (!isValidTimeWindow(startTime, endTime)) {
      setError("End time must be after start time");
      return;
    }

    const conflict = findOverlappingBlock(
      startTime,
      endTime,
      existingBlocks,
      mode === "edit" ? initialBlock?.id : undefined,
    );
    if (conflict) {
      setError(
        `Conflicts with "${conflict.title}" (${fmtTime(conflict.startTime)} - ${fmtTime(conflict.endTime)})`,
      );
      return;
    }

    const blockData = {
      title: trimmedTitle,
      description: description.trim() || undefined,
      category,
      availability: availabilityValue,
      startTime: startTime,
      endTime: endTime,
    };

    const block =
      mode === "edit" && initialBlock
        ? { ...initialBlock, ...blockData }
        : createScheduleBlock(blockData);

    setError(null);
    setIsSaving(true);
    try {
      await onSave(block);
    } catch {
      setError("Failed to save time block. Please try again.");
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !initialBlock) return;
    setError(null);
    setIsSaving(true);
    try {
      await onDelete(initialBlock.id);
    } catch {
      setError("Failed to delete time block. Please try again.");
      setIsSaving(false);
    }
  };

  const inputStyle = {
    fontFamily: FONT,
    color: "#3B2C20",
    borderColor: "rgba(90,66,46,0.25)",
    backgroundColor: "#FFFDF7",
  };

  return (
    <div
      className='fixed inset-0 flex items-center justify-center z-50 p-4'
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={onClose}>
      <div
        className='w-full rounded-xl border p-6 flex flex-col gap-3'
        style={{
          maxWidth: "440px",
          backgroundColor: "#FBF6EB",
          borderColor: "rgba(90,66,46,0.18)",
          fontFamily: FONT,
        }}
        onClick={(e) => e.stopPropagation()}>
        <h2
          className='text-[19px] font-bold mb-1'
          style={{ color: "#3B2C20", fontFamily: FONT }}>
          {mode === "create" ? "Create Time Block" : "Edit Time Block"}
        </h2>

        <label
          className='flex flex-col gap-1 text-[13px]'
          style={{ color: "#6B5A46" }}>
          Title
          <input
            type='text'
            className='px-2.5 py-1.5 rounded-md border text-[14px]'
            style={inputStyle}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>

        <label
          className='flex flex-col gap-1 text-[13px]'
          style={{ color: "#6B5A46" }}>
          Description
          <textarea
            className='px-2.5 py-1.5 rounded-md border text-[14px] resize-none'
            style={inputStyle}
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        <div className='flex gap-3'>
          <label
            className='flex-1 flex flex-col gap-1 text-[13px]'
            style={{ color: "#6B5A46" }}>
            Category
            <select
              className='px-2.5 py-1.5 rounded-md border text-[14px]'
              style={inputStyle}
              value={category}
              onChange={(e) => setCategory(e.target.value as activityCategory)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {label(c)}
                </option>
              ))}
            </select>
          </label>

          <label
            className='flex-1 flex flex-col gap-1 text-[13px]'
            style={{ color: "#6B5A46" }}>
            Availability
            <select
              className='px-2.5 py-1.5 rounded-md border text-[14px]'
              style={inputStyle}
              value={availabilityValue}
              onChange={(e) =>
                setAvailabilityValue(e.target.value as availability)
              }>
              {AVAILABILITIES.map((a) => (
                <option key={a} value={a}>
                  {label(a)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className='flex gap-3'>
          <label
            className='flex-1 flex flex-col gap-1 text-[13px]'
            style={{ color: "#6B5A46" }}>
            Start time
            <input
              type='time'
              className='px-2.5 py-1.5 rounded-md border text-[14px]'
              style={inputStyle}
              value={startTimeStr}
              onChange={(e) => setStartTimeStr(e.target.value)}
            />
          </label>

          <label
            className='flex-1 flex flex-col gap-1 text-[13px]'
            style={{ color: "#6B5A46" }}>
            End time
            <input
              type='time'
              className='px-2.5 py-1.5 rounded-md border text-[14px]'
              style={inputStyle}
              value={endTimeStr}
              onChange={(e) => setEndTimeStr(e.target.value)}
            />
          </label>
        </div>

        {error && (
          <div className='text-[12.5px]' style={{ color: "#B3453D" }}>
            {error}
          </div>
        )}

        <div className='flex items-center justify-between mt-2'>
          <div>
            {mode === "edit" && onDelete && initialBlock && (
              <button
                onClick={handleDelete}
                disabled={isSaving}
                className='px-3.5 py-2 rounded-lg text-[13px] font-bold disabled:opacity-50'
                style={{
                  backgroundColor: "#E8C6C0",
                  color: "#6B2E24",
                  fontFamily: FONT,
                }}>
                Delete
              </button>
            )}
          </div>
          <div className='flex gap-2'>
            <button
              onClick={onClose}
              disabled={isSaving}
              className='px-3.5 py-2 rounded-lg text-[13px] font-bold disabled:opacity-50'
              style={{
                backgroundColor: "#F1E8D6",
                color: "#3B2C20",
                fontFamily: FONT,
              }}>
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className='px-3.5 py-2 rounded-lg text-[13px] font-bold disabled:opacity-50'
              style={{
                backgroundColor: "#A9C7E8",
                color: "#3B2C20",
                fontFamily: FONT,
              }}>
              {isSaving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScheduleBlockModal;
