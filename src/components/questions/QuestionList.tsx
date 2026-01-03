// src/components/questions/QuestionList.tsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Clock, Loader2 } from "lucide-react";
import type { Question } from "@/types";
import { getQuestions } from "@/actions/question.actions";

export function QuestionList() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getQuestions();

      if (!result.success) {
        setError(result.error);
        return;
      }

      setQuestions(result.data);
    } catch (err) {
      setError("Failed to load questions");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading questions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h3 className="text-lg font-semibold mb-2">Error Loading Questions</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <button
          onClick={loadQuestions}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📚</span>
        </div>
        <h3 className="text-lg font-semibold mb-2">No Questions Found</h3>
        <p className="text-muted-foreground">
          Run the seed script to populate the database with questions.
        </p>
        <pre className="mt-4 p-3 bg-muted rounded-lg text-sm text-left inline-block">
          npm run seed
        </pre>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {questions.map((question) => (
        <QuestionCard key={question.id} question={question} />
      ))}
    </div>
  );
}

function QuestionCard({ question }: { question: Question }) {
  return (
    <Link
      href={`/questions/${question.id}`}
      className="block p-4 rounded-lg border bg-card hover:border-primary hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {question.question}
          </h3>
          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
            <span
              className={`px-2 py-0.5 rounded-full text-xs ${getCategoryBadgeClass(
                question.category
              )}`}
            >
              {formatCategory(question.category)}
            </span>
            <span
              className={`capitalize ${getDifficultyColor(
                question.difficulty
              )}`}
            >
              {question.difficulty}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {getEstimatedTime(question.difficulty)} min
            </span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
      </div>
    </Link>
  );
}

function formatCategory(category: string): string {
  return category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getCategoryBadgeClass(category: string): string {
  const colors: Record<string, string> = {
    "system-design":
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    "caching-memoization":
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    "bundle-tree-shaking":
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    "security-auth":
      "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    "feature-flags":
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    "css-layout":
      "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
    "js-event-loop":
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    accessibility:
      "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
    "react-internals":
      "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  };
  return colors[category] || "bg-muted text-muted-foreground";
}

function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case "junior":
      return "text-green-600 dark:text-green-400";
    case "mid":
      return "text-yellow-600 dark:text-yellow-400";
    case "senior":
      return "text-red-600 dark:text-red-400";
    default:
      return "";
  }
}

function getEstimatedTime(difficulty: string): number {
  switch (difficulty) {
    case "junior":
      return 3;
    case "mid":
      return 5;
    case "senior":
      return 8;
    default:
      return 5;
  }
}
