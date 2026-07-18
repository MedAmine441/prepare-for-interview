// src/app/interview/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Play, Check, History, Loader2 } from "lucide-react";
import { startInterview } from "@/actions/interview.actions";
import { CATEGORY_METADATA } from "@/lib/constants/categories";
import { getCategoryEmoji } from "@/lib/utils/question-format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { QuestionCategory, Difficulty, InterviewMode } from "@/types";

export default function InterviewSetupPage() {
  const router = useRouter();
  const [selectedCategories, setSelectedCategories] = useState<QuestionCategory[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>("mid");
  const [mode, setMode] = useState<InterviewMode>("mixed");
  const [maxQuestions, setMaxQuestions] = useState(5);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const handleCategoryToggle = (category: QuestionCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleStartInterview = async () => {
    if (isStarting) return;
    setIsStarting(true);
    setStartError(null);
    try {
      // Persist the session up front so the transcript and debrief survive
      const result = await startInterview({
        categories: selectedCategories,
        difficulty,
        mode,
        maxQuestions,
      });
      if (!result.success) {
        setStartError(result.error);
        return;
      }
      router.push(`/interview/${result.data.sessionId}`);
    } catch (err) {
      console.error(err);
      setStartError("Failed to start the interview. Please try again.");
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Mock Interview</h1>
          <p className="text-muted-foreground">
            Configure your interview session and start practicing.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/interview/history">
            <History className="w-4 h-4 mr-1.5" />
            Past sessions
          </Link>
        </Button>
      </div>

      <div className="space-y-8">
        {/* Topics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Topics</CardTitle>
            <CardDescription>
              Select categories to focus on. Leave empty for all topics.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(CATEGORY_METADATA).map((category) => {
                const isSelected = selectedCategories.includes(category.slug);
                return (
                  <button
                    key={category.slug}
                    onClick={() => handleCategoryToggle(category.slug)}
                    className={`flex items-center gap-2 p-3 rounded-md border text-left transition-colors ${
                      isSelected
                        ? "border-foreground bg-secondary"
                        : "border-border hover:bg-secondary/50"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded ${category.color} flex items-center justify-center text-white text-xs shrink-0`}
                    >
                      {getCategoryEmoji(category.slug)}
                    </div>
                    <span className="text-sm font-medium truncate">{category.name}</span>
                    {isSelected && <Check className="w-4 h-4 ml-auto shrink-0" />}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Difficulty */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Difficulty</CardTitle>
            <CardDescription>Choose the complexity level of questions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {(["junior", "mid", "senior"] as Difficulty[]).map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`flex-1 px-4 py-2 rounded-md border text-sm font-medium transition-colors capitalize ${
                    difficulty === level
                      ? "border-foreground bg-secondary"
                      : "border-border hover:bg-secondary/50"
                  }`}
                >
                  {level === "mid" ? "Mid-Level" : level}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Question Source */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Question Source</CardTitle>
            <CardDescription>Where should questions come from?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(
              [
                {
                  value: "seed-only",
                  label: "Curated Questions",
                  desc: "Pre-written high-quality questions",
                },
                {
                  value: "ai-generated",
                  label: "AI Generated",
                  desc: "Fresh questions from AI",
                },
                {
                  value: "mixed",
                  label: "Mixed",
                  desc: "Both curated and AI questions",
                },
              ] as { value: InterviewMode; label: string; desc: string }[]
            ).map((option) => (
              <button
                key={option.value}
                onClick={() => setMode(option.value)}
                className={`w-full flex items-center justify-between p-3 rounded-md border text-left transition-colors ${
                  mode === option.value
                    ? "border-foreground bg-secondary"
                    : "border-border hover:bg-secondary/50"
                }`}
              >
                <div>
                  <p className="text-sm font-medium">{option.label}</p>
                  <p className="text-xs text-muted-foreground">{option.desc}</p>
                </div>
                {mode === option.value && <Check className="w-4 h-4 shrink-0" />}
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Question Count */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Number of Questions</CardTitle>
            <CardDescription>How many questions in this session?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {[3, 5, 10].map((count) => (
                <button
                  key={count}
                  onClick={() => setMaxQuestions(count)}
                  className={`flex-1 px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
                    maxQuestions === count
                      ? "border-foreground bg-secondary"
                      : "border-border hover:bg-secondary/50"
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Start */}
        <Button
          onClick={handleStartInterview}
          className="w-full"
          size="lg"
          disabled={isStarting}
        >
          {isStarting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Play className="w-4 h-4 mr-2" />
          )}
          {isStarting ? "Setting up..." : "Start Interview"}
        </Button>
        {startError && (
          <p className="text-sm text-red-600 dark:text-red-400 text-center">
            {startError}
          </p>
        )}
      </div>
    </div>
  );
}

