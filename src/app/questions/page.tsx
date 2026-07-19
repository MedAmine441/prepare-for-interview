// src/app/questions/page.tsx

"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Clock, Loader2, Plus } from "lucide-react";
import { SearchInput } from "@/components/shared/SearchInput";
import { CategoryFilter } from "@/components/shared/CategoryFilter";
import { DifficultyFilter } from "@/components/shared/DifficultyFilter";
import { getQuestions } from "@/actions/question.actions";
import {
  getQuestionStatusMap,
  getLeechQuestionIds,
  type StudyStatus,
} from "@/actions/flashcard.actions";
import { GeneratePanel } from "@/components/questions/GeneratePanel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  formatCategory,
  getDifficultyColor,
  getEstimatedTime,
} from "@/lib/utils/question-format";
import type { Question, QuestionCategory, Difficulty } from "@/types";

export default function QuestionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <QuestionsPageContent />
    </Suspense>
  );
}

function QuestionsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialSearch = searchParams.get("search") || "";
  const initialCategory = (searchParams.get("category") || "all") as QuestionCategory | "all";
  const initialDifficulty = (searchParams.get("difficulty") || "all") as Difficulty | "all";

  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, StudyStatus>>({});
  const [leechIds, setLeechIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [category, setCategory] = useState<QuestionCategory | "all">(initialCategory);
  const [difficulty, setDifficulty] = useState<Difficulty | "all">(initialDifficulty);

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
    [router, searchParams]
  );

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    let filtered = [...questions];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (q) =>
          q.question.toLowerCase().includes(query) ||
          q.answer.toLowerCase().includes(query) ||
          q.keyPoints.some((kp) => kp.toLowerCase().includes(query))
      );
    }

    if (category !== "all") {
      filtered = filtered.filter((q) => q.category === category);
    }

    if (difficulty !== "all") {
      filtered = filtered.filter((q) => q.difficulty === difficulty);
    }

    setFilteredQuestions(filtered);
  }, [questions, searchQuery, category, difficulty]);

  const loadQuestions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [result, statuses, leeches] = await Promise.all([
        getQuestions(),
        getQuestionStatusMap(),
        getLeechQuestionIds(),
      ]);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setQuestions(result.data);
      setFilteredQuestions(result.data);
      if (statuses.success) {
        setStatusMap(statuses.data);
      }
      if (leeches.success) {
        setLeechIds(new Set(leeches.data));
      }
    } catch (err) {
      setError("Failed to load questions");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Questions</h1>
          <p className="text-muted-foreground">
            Browse all interview questions in the library.
          </p>
        </div>
        <Button asChild>
          <Link href="/flashcards/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Link>
        </Button>
      </div>

      {/* AI generation */}
      <div className="mb-6">
        <GeneratePanel onGenerated={loadQuestions} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchInput
          value={searchQuery}
          onChange={(val) => {
            setSearchQuery(val);
            updateParams("search", val);
          }}
          placeholder="Search questions..."
          className="flex-1"
        />
        <div className="flex gap-2">
          <CategoryFilter
            value={category}
            onChange={(val) => {
              setCategory(val);
              updateParams("category", val);
            }}
          />
          <DifficultyFilter
            value={difficulty}
            onChange={(val) => {
              setDifficulty(val);
              updateParams("difficulty", val);
            }}
          />
        </div>
      </div>

      {/* Results count */}
      {!isLoading && !error && (
        <p className="text-sm text-muted-foreground mb-4">
          {filteredQuestions.length} of {questions.length} questions
        </p>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Loading questions...</p>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={loadQuestions}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : filteredQuestions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-sm text-muted-foreground mb-4">
              {questions.length === 0
                ? "No questions found. Run npm run seed to populate."
                : "No matching questions. Try adjusting filters."}
            </p>
            {questions.length === 0 && (
              <code className="text-xs bg-muted px-2 py-1 rounded">npm run seed</code>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredQuestions.map((question) => (
            <QuestionRow
              key={question.id}
              question={question}
              status={statusMap[question.id] ?? "new"}
              isLeech={leechIds.has(question.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const STATUS_STYLES: Record<StudyStatus, { label: string; className: string }> = {
  new: { label: "New", className: "text-muted-foreground border-border" },
  due: {
    label: "Due",
    className: "text-orange-600 border-orange-300 dark:text-orange-400 dark:border-orange-900",
  },
  learning: {
    label: "Learning",
    className: "text-blue-600 border-blue-300 dark:text-blue-400 dark:border-blue-900",
  },
  mastered: {
    label: "Mastered",
    className: "text-green-600 border-green-300 dark:text-green-400 dark:border-green-900",
  },
};

function QuestionRow({
  question,
  status,
  isLeech,
}: {
  question: Question;
  status: StudyStatus;
  isLeech: boolean;
}) {
  return (
    <Link href={`/questions/${question.id}`} className="block group">
      <Card className="transition-colors hover:bg-secondary/50">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-medium mb-2 line-clamp-2 group-hover:text-foreground transition-colors">
                {question.question}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs font-normal">
                  {formatCategory(question.category)}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-xs font-normal ${getDifficultyColor(question.difficulty)}`}
                >
                  {question.difficulty}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-xs font-normal ${STATUS_STYLES[status].className}`}
                >
                  {STATUS_STYLES[status].label}
                </Badge>
                {isLeech && (
                  <Badge
                    variant="outline"
                    className="text-xs font-normal text-red-600 border-red-300 dark:text-red-400 dark:border-red-900"
                    title="Failed repeatedly — consider rewriting this card"
                  >
                    Leech
                  </Badge>
                )}
                {question.source === "ai-generated" && (
                  <Badge variant="outline" className="text-xs font-normal text-purple-600 border-purple-300 dark:text-purple-400 dark:border-purple-900">
                    AI
                  </Badge>
                )}
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {getEstimatedTime(question.difficulty)}m
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
