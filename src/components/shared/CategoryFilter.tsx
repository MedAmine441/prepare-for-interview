// src/components/shared/CategoryFilter.tsx

"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_METADATA } from "@/lib/constants/categories";
import type { QuestionCategory } from "@/types";

interface CategoryFilterProps {
  value: QuestionCategory | "all";
  onChange: (value: QuestionCategory | "all") => void;
  placeholder?: string;
  showAllOption?: boolean;
}

export function CategoryFilter({
  value,
  onChange,
  placeholder = "Select category",
  showAllOption = true,
}: CategoryFilterProps) {
  return (
    <Select
      value={value}
      onValueChange={(val) => onChange(val as QuestionCategory | "all")}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {showAllOption && <SelectItem value="all">All Categories</SelectItem>}
        {Object.values(CATEGORY_METADATA).map((category) => (
          <SelectItem key={category.slug} value={category.slug}>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
