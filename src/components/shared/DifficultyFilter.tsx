// src/components/shared/DifficultyFilter.tsx

"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DIFFICULTY_METADATA } from "@/lib/constants/categories";
import type { Difficulty } from "@/types";

interface DifficultyFilterProps {
  value: Difficulty | "all";
  onChange: (value: Difficulty | "all") => void;
  placeholder?: string;
  showAllOption?: boolean;
}

export function DifficultyFilter({
  value,
  onChange,
  placeholder = "Select difficulty",
  showAllOption = true,
}: DifficultyFilterProps) {
  return (
    <Select
      value={value}
      onValueChange={(val) => onChange(val as Difficulty | "all")}
    >
      <SelectTrigger className="w-[160px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {showAllOption && <SelectItem value="all">All Levels</SelectItem>}
        {Object.entries(DIFFICULTY_METADATA).map(([key, meta]) => (
          <SelectItem key={key} value={key}>
            {meta.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
