// src/components/home/InterviewCountdown.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarClock, Pencil, X } from "lucide-react";
import { setInterviewDate } from "@/actions/settings.actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface InterviewCountdownProps {
  /** Stored target date (YYYY-MM-DD) or null when unset */
  interviewDate: string | null;
  /** Cards never studied yet */
  newCount: number;
  /** Cards due for review right now */
  dueCount: number;
}

export function InterviewCountdown({
  interviewDate,
  newCount,
  dueCount,
}: InterviewCountdownProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(interviewDate ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const save = async (value: string | null) => {
    setIsSaving(true);
    try {
      const result = await setInterviewDate(value);
      if (result.success) {
        setIsEditing(false);
        router.refresh();
      }
    } finally {
      setIsSaving(false);
    }
  };

  // No date set: a quiet one-liner instead of a whole card
  if (!interviewDate && !isEditing) {
    return (
      <div className="flex items-center justify-center gap-2 mb-12 text-sm text-muted-foreground">
        <CalendarClock className="w-4 h-4" />
        <span>Interview coming up?</span>
        <button
          onClick={() => setIsEditing(true)}
          className="font-medium text-primary hover:underline"
        >
          Set the date
        </button>
        <span>to get a daily study plan.</span>
      </div>
    );
  }

  if (isEditing) {
    return (
      <Card className="mb-12 max-w-md mx-auto">
        <CardContent className="p-4 flex items-center gap-3">
          <CalendarClock className="w-4 h-4 text-primary shrink-0" />
          <input
            type="date"
            value={draft}
            min={todayString()}
            onChange={(e) => setDraft(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button
            size="sm"
            onClick={() => draft && save(draft)}
            disabled={!draft || isSaving}
          >
            Save
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
        </CardContent>
      </Card>
    );
  }

  const daysLeft = daysUntil(interviewDate!);
  const dateLabel = new Date(`${interviewDate}T00:00:00`).toLocaleDateString(
    "en-US",
    { weekday: "short", month: "short", day: "numeric" },
  );

  if (daysLeft < 0) {
    return (
      <div className="flex items-center justify-center gap-2 mb-12 text-sm text-muted-foreground">
        <CalendarClock className="w-4 h-4" />
        <span>Your interview date ({dateLabel}) has passed.</span>
        <button
          onClick={() => setIsEditing(true)}
          className="font-medium text-primary hover:underline"
        >
          Set a new one
        </button>
        <button
          onClick={() => save(null)}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Clear interview date"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Pacing: clear the unseen backlog while leaving a few days pure-review
  const reviewBuffer = daysLeft >= 10 ? 4 : daysLeft >= 5 ? 2 : 1;
  const studyDays = Math.max(1, daysLeft - reviewBuffer);
  const newPerDay = Math.ceil(newCount / studyDays);

  return (
    <Card className="mb-12 max-w-2xl mx-auto overflow-hidden">
      <div className="h-0.5 bg-brand-gradient" aria-hidden />
      <CardContent className="p-5">
        <div className="flex items-center gap-5">
          <div className="text-center shrink-0">
            <p className="text-3xl font-bold font-mono tabular-nums text-primary">
              {daysLeft === 0 ? "Today" : `D-${daysLeft}`}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{dateLabel}</p>
          </div>
          <div className="flex-1 min-w-0">
            {daysLeft === 0 ? (
              <p className="text-sm leading-relaxed">
                <span className="font-medium">Interview day.</span> No new cards —
                skim your due reviews and walk in fresh. Good luck! 🍀
              </p>
            ) : newCount > 0 ? (
              <p className="text-sm leading-relaxed">
                <Link
                  href="/flashcards/study"
                  className="font-medium text-primary hover:underline"
                >
                  ~{newPerDay} new card{newPerDay > 1 ? "s" : ""}/day
                </Link>{" "}
                clears your{" "}
                <span className="font-mono tabular-nums">{newCount}</span> unseen
                card{newCount > 1 ? "s" : ""} with a {reviewBuffer}-day review
                buffer before the interview
                {dueCount > 0 && (
                  <span className="text-muted-foreground">
                    {" "}
                    · {dueCount} due today
                  </span>
                )}
                .
              </p>
            ) : (
              <p className="text-sm leading-relaxed">
                Every card has been introduced — keep clearing your daily reviews
                {dueCount > 0 ? ` (${dueCount} due today)` : ""} and do a mock
                interview per topic.
              </p>
            )}
          </div>
          <button
            onClick={() => {
              setDraft(interviewDate ?? "");
              setIsEditing(true);
            }}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            aria-label="Edit interview date"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function todayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

/** Whole days from today (local midnight) to the target date */
function daysUntil(date: string): number {
  const target = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}
