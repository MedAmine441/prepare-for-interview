// src/components/flashcard/StudyModeToggle.tsx

"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { StudyMode } from "./FlashcardArena";

/**
 * Segmented control switching between scheduled review and cram practice.
 * Persists the choice in the `mode` query param.
 */
export function StudyModeToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mode: StudyMode =
    searchParams.get("mode") === "practice" ? "practice" : "review";

  const setMode = (next: StudyMode) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "review") {
      params.delete("mode");
    } else {
      params.set("mode", next);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <div className="inline-flex rounded-md border p-0.5 bg-muted/50">
      <ModeButton
        active={mode === "review"}
        onClick={() => setMode("review")}
        label="Review due"
        title="Spaced repetition — only cards scheduled for today"
      />
      <ModeButton
        active={mode === "practice"}
        onClick={() => setMode("practice")}
        label="Practice all"
        title="Cram every card, shuffled — doesn't affect your schedule"
      />
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  label,
  title,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
        active
          ? "bg-background text-foreground shadow-sm border"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
