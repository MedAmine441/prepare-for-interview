// src/actions/settings.actions.ts

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getMeta, setMeta } from "@/lib/db";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const DateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

/**
 * The target interview date (YYYY-MM-DD) drives the home-page countdown
 * and study pacing. Stored in the metadata table.
 */
export async function getInterviewDate(): Promise<string | null> {
  return getMeta<string | null>("interviewDate", null);
}

export async function setInterviewDate(
  date: string | null,
): Promise<ActionResult<void>> {
  try {
    if (date !== null) {
      const parsed = DateSchema.safeParse(date);
      if (!parsed.success) {
        return { success: false, error: "Invalid date" };
      }
    }
    setMeta("interviewDate", date);
    revalidatePath("/");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error saving interview date:", error);
    return { success: false, error: "Failed to save the date" };
  }
}
