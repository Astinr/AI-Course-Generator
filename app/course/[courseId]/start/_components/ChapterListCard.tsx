import { ChapterType } from "@/types/types";
import React from "react";
import { LuTimer } from "react-icons/lu";

type ChapterListCardProps = {
  chapter: ChapterType;
  index: number;
  selected: boolean;
  onSelect: () => void;
};

const ChapterListCard = ({
  chapter,
  index,
  selected,
  onSelect,
}: ChapterListCardProps) => {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`group flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
        selected
          ? "border-primary/20 bg-secondary text-primary"
          : "border-transparent hover:bg-muted"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
          selected
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-primary"
        }`}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block line-clamp-2 text-sm font-medium leading-5">
          {chapter.chapter_name}
        </span>
        <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <LuTimer aria-hidden="true" />
          {chapter.duration}
        </span>
      </span>
    </button>
  );
};

export default ChapterListCard;
