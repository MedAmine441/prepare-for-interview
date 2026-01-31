// src/app/questions/[id]/page.tsx

import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Clock, ArrowLeft } from "lucide-react";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import { getQuestionById } from "@/actions/question.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface QuestionPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function QuestionDetailPage({ params }: QuestionPageProps) {
  const { id } = await params;

  const result = await getQuestionById(id);

  if (!result.success) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-sm text-muted-foreground mb-4">{result.error}</p>
          <Button asChild variant="outline">
            <Link href="/questions">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Questions
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const question = result.data;

  if (!question) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/questions" className="hover:text-foreground transition-colors">
          Questions
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground font-medium truncate max-w-[200px]">
          {question.question.slice(0, 30)}...
        </span>
      </nav>

      {/* Question */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-4">{question.question}</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="secondary">{formatCategory(question.category)}</Badge>
          <Badge variant="outline" className={getDifficultyColor(question.difficulty)}>
            {question.difficulty}
          </Badge>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            ~{getEstimatedTime(question.difficulty)} min
          </span>
          {question.source && (
            <Badge variant="outline" className="text-xs">
              {formatSource(question.source)}
            </Badge>
          )}
        </div>
      </div>

      {/* Answer */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Model Answer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <MarkdownRenderer content={question.answer} />
          </div>
        </CardContent>
      </Card>

      {/* Key Points */}
      {question.keyPoints.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Key Points</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {question.keyPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-secondary text-foreground flex items-center justify-center text-xs font-medium shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm">{point}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Follow-up Questions */}
      {question.followUpQuestions.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Follow-up Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {question.followUpQuestions.map((q, i) => (
                <li key={i} className="text-sm p-3 rounded-md bg-muted/50">
                  <span className="font-medium text-muted-foreground mr-2">Q{i + 1}:</span>
                  {q}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Related Topics */}
      {question.relatedTopics.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Related Topics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {question.relatedTopics.map((topic, i) => (
                <Badge key={i} variant="secondary">
                  {topic}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Common At */}
      {question.commonAt && question.commonAt.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Commonly Asked At</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {question.commonAt.map((company, i) => (
                <Badge key={i} variant="outline">
                  {company}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator className="my-8" />

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href={`/flashcards/${question.category}`}>Study This Topic</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/questions">Back to Library</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/interview">Practice Interview</Link>
        </Button>
      </div>
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
      return "text-green-600 border-green-200";
    case "mid":
      return "text-yellow-600 border-yellow-200";
    case "senior":
      return "text-red-600 border-red-200";
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
