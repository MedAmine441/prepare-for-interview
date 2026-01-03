// src/app/questions/[id]/page.tsx

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Tag, Loader2 } from "lucide-react";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import { getQuestionById } from "@/actions/question.actions";

interface QuestionPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function QuestionDetailPage({
  params,
}: QuestionPageProps) {
  const { id } = await params;

  // Fetch question from database
  const result = await getQuestionById(id);

  if (!result.success) {
    // Show error page
    return (
      <div className="min-h-screen">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/questions"
                className="p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="font-semibold">Error</h1>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold mb-4">Error Loading Question</h2>
          <p className="text-muted-foreground mb-8">{result.error}</p>
          <Link
            href="/questions"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Questions
          </Link>
        </main>
      </div>
    );
  }

  const question = result.data;

  if (!question) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/questions"
              className="p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-semibold">Question Detail</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="capitalize">
                  {formatCategory(question.category)}
                </span>
                <span>•</span>
                <span
                  className={`capitalize ${getDifficultyColor(
                    question.difficulty
                  )}`}
                >
                  {question.difficulty}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Question */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{question.question}</h2>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />~
              {getEstimatedTime(question.difficulty)} min
            </span>
            <span className="flex items-center gap-1">
              <Tag className="w-4 h-4" />
              {formatCategory(question.category)}
            </span>
            {question.source && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${getSourceBadgeClass(
                  question.source
                )}`}
              >
                {formatSource(question.source)}
              </span>
            )}
          </div>
        </section>

        {/* Answer */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Model Answer</h3>
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <MarkdownRenderer content={question.answer} />
          </div>
        </section>

        {/* Key Points */}
        {question.keyPoints.length > 0 && (
          <section className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Key Points to Cover</h3>
            <ul className="space-y-2">
              {question.keyPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="flex-1">{point}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Follow-up Questions */}
        {question.followUpQuestions.length > 0 && (
          <section className="mb-8">
            <h3 className="text-lg font-semibold mb-4">
              Common Follow-up Questions
            </h3>
            <ul className="space-y-2">
              {question.followUpQuestions.map((q, i) => (
                <li key={i} className="p-3 rounded-lg bg-muted/50 border">
                  <span className="font-medium text-sm text-primary mr-2">
                    Q{i + 1}:
                  </span>
                  {q}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Related Topics */}
        {question.relatedTopics.length > 0 && (
          <section className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Related Topics</h3>
            <div className="flex flex-wrap gap-2">
              {question.relatedTopics.map((topic, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm"
                >
                  {topic}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Common At Companies */}
        {question.commonAt && question.commonAt.length > 0 && (
          <section className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Commonly Asked At</h3>
            <div className="flex flex-wrap gap-2">
              {question.commonAt.map((company, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full border bg-card text-sm font-medium"
                >
                  {company}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-4 pt-6 border-t">
          <Link
            href={`/flashcards/${question.category}`}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Study This Topic
          </Link>
          <Link
            href="/questions"
            className="px-4 py-2 rounded-lg border hover:bg-accent transition-colors"
          >
            Back to Library
          </Link>
          <Link
            href="/interview"
            className="px-4 py-2 rounded-lg border hover:bg-accent transition-colors"
          >
            Practice in Interview Mode
          </Link>
        </div>
      </main>
    </div>
  );
}

function formatCategory(category: string): string {
  return category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatSource(source: string): string {
  return source
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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

function getSourceBadgeClass(source: string): string {
  switch (source) {
    case "seed":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "ai-generated":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    case "user-created":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    default:
      return "bg-muted text-muted-foreground";
  }
}
