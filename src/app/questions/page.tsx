// src/app/questions/page.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Clock, Loader2, Plus } from "lucide-react";
import { SearchInput } from "@/components/shared/SearchInput";
import { CategoryFilter } from "@/components/shared/CategoryFilter";
import { DifficultyFilter } from "@/components/shared/DifficultyFilter";
import { getQuestions } from "@/actions/question.actions";
import type { Question, QuestionCategory, Difficulty } from "@/types";

export default function QuestionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read initial values from URL
  const initialSearch = searchParams.get("search") || "";
  const initialCategory = (searchParams.get("category") || "all") as
    | QuestionCategory
    | "all";
  const initialDifficulty = (searchParams.get("difficulty") || "all") as
    | Difficulty
    | "all";

  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [category, setCategory] = useState<QuestionCategory | "all">(
    initialCategory,
  );
  const [difficulty, setDifficulty] = useState<Difficulty | "all">(
    initialDifficulty,
  );

  // Update URL when filters change
  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "" || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      const queryString = params.toString();
      router.push(queryString ? `/questions?${queryString}` : "/questions");
    },
    [router, searchParams],
  );

  // Load all questions on mount
  useEffect(() => {
    loadQuestions();
  }, []);

  // Filter questions when filters change
  useEffect(() => {
    let filtered = [...questions];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (q) =>
          q.question.toLowerCase().includes(query) ||
          q.answer.toLowerCase().includes(query) ||
          q.keyPoints.some((kp) => kp.toLowerCase().includes(query)),
      );
    }

    // Filter by category
    if (category !== "all") {
      filtered = filtered.filter((q) => q.category === category);
    }

    // Filter by difficulty
    if (difficulty !== "all") {
      filtered = filtered.filter((q) => q.difficulty === difficulty);
    }

    setFilteredQuestions(filtered);
  }, [questions, searchQuery, category, difficulty]);

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
      setFilteredQuestions(result.data);
    } catch (err) {
      setError("Failed to load questions");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    updateParams("search", value);
  };

  const handleCategoryChange = (value: QuestionCategory | "all") => {
    setCategory(value);
    updateParams("category", value);
  };

  const handleDifficultyChange = (value: Difficulty | "all") => {
    setDifficulty(value);
    updateParams("difficulty", value);
  };

  return (
    <div className="min-h-screen">
      {/* Sub-header */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-lg">Question Library</h1>
            <p className="text-sm text-muted-foreground">
              Browse all interview questions
            </p>
          </div>
          <Link
            href="/flashcards/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Question
          </Link>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <SearchInput
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search questions..."
            className="flex-1"
          />
          <div className="flex gap-3">
            <CategoryFilter value={category} onChange={handleCategoryChange} />
            <DifficultyFilter
              value={difficulty}
              onChange={handleDifficultyChange}
            />
          </div>
        </div>

        {/* Results count */}
        {!isLoading && !error && (
          <p className="text-sm text-muted-foreground mb-4">
            Showing {filteredQuestions.length} of {questions.length} questions
          </p>
        )}

        {/* Question List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading questions...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Error Loading Questions
            </h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button
              onClick={loadQuestions}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📚</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {questions.length === 0
                ? "No Questions Found"
                : "No Matching Questions"}
            </h3>
            <p className="text-muted-foreground">
              {questions.length === 0
                ? "Run the seed script to populate the database with questions."
                : "Try adjusting your filters or search query."}
            </p>
            {questions.length === 0 && (
              <pre className="mt-4 p-3 bg-muted rounded-lg text-sm text-left inline-block">
                npm run seed
              </pre>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredQuestions.map((question) => (
              <QuestionCard key={question.id} question={question} />
            ))}
          </div>
        )}
      </main>
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
                question.category,
              )}`}
            >
              {formatCategory(question.category)}
            </span>
            <span
              className={`capitalize ${getDifficultyColor(
                question.difficulty,
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
