// src/components/questions/GeneratePanel.tsx

"use client";

import { useState } from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import { CategoryFilter } from "@/components/shared/CategoryFilter";
import { DifficultyFilter } from "@/components/shared/DifficultyFilter";
import { generateQuestions } from "@/actions/generate.actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QUESTION_CATEGORIES } from "@/types";
import type { QuestionCategory, Difficulty } from "@/types";

interface GeneratePanelProps {
  /** Called after questions were added so the list can refresh */
  onGenerated: () => void;
}

export function GeneratePanel({ onGenerated }: GeneratePanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<QuestionCategory>(
    QUESTION_CATEGORIES.JS_FUNDAMENTALS,
  );
  const [difficulty, setDifficulty] = useState<Difficulty>("mid");
  const [count, setCount] = useState(2);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setMessage(null);
    try {
      const result = await generateQuestions(category, difficulty, count);
      if (result.success) {
        setMessage({
          ok: true,
          text: `Added ${result.data.length} new question${result.data.length > 1 ? "s" : ""} to the bank.`,
        });
        onGenerated();
      } else {
        setMessage({ ok: false, text: result.error });
      }
    } catch {
      setMessage({ ok: false, text: "Generation failed — try again." });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) {
    return (
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        <Sparkles className="w-4 h-4 mr-2" />
        Generate with AI
      </Button>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Generate new questions
          </p>
          <button
            onClick={() => setIsOpen(false)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close generate panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <CategoryFilter
            value={category}
            onChange={(v) => v !== "all" && setCategory(v)}
            showAllOption={false}
          />
          <DifficultyFilter
            value={difficulty}
            onChange={(v) => v !== "all" && setDifficulty(v)}
            showAllOption={false}
          />
          <div className="inline-flex rounded-md border p-0.5 bg-muted/50">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  count === n
                    ? "bg-background text-foreground shadow-sm border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <Button onClick={handleGenerate} disabled={isGenerating} size="sm">
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating…
              </>
            ) : (
              "Generate"
            )}
          </Button>
        </div>

        {isGenerating && (
          <p className="text-xs text-muted-foreground">
            The AI is writing {count} question{count > 1 ? "s" : ""} with model
            answers — this can take a minute.
          </p>
        )}
        {message && (
          <p
            className={`text-xs ${
              message.ok
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {message.text}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
