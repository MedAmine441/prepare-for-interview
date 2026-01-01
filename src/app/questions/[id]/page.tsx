// src/app/questions/[id]/page.tsx

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, Tag } from 'lucide-react';
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';

interface QuestionPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function QuestionDetailPage({ params }: QuestionPageProps) {
  const { id } = await params;

  // TODO: Fetch question from database
  // For now, show placeholder
  const question = {
    id,
    category: 'react-internals',
    difficulty: 'senior' as const,
    question: 'Loading question...',
    answer: 'Loading answer...',
    keyPoints: [] as string[],
    followUpQuestions: [] as string[],
  };

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
                <span className="capitalize">{question.category.replace('-', ' ')}</span>
                <span>•</span>
                <span className={`capitalize ${getDifficultyColor(question.difficulty)}`}>
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
              <Clock className="w-4 h-4" />
              ~8 min
            </span>
            <span className="flex items-center gap-1">
              <Tag className="w-4 h-4" />
              {question.category}
            </span>
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
            <h3 className="text-lg font-semibold mb-4">Key Points</h3>
            <ul className="space-y-2">
              {question.keyPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm shrink-0">
                    {i + 1}
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Follow-up Questions */}
        {question.followUpQuestions.length > 0 && (
          <section className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Follow-up Questions</h3>
            <ul className="space-y-2">
              {question.followUpQuestions.map((q, i) => (
                <li key={i} className="p-3 rounded-lg bg-muted/50">
                  {q}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Actions */}
        <div className="flex gap-4">
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
        </div>
      </main>
    </div>
  );
}

function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'junior':
      return 'text-green-600';
    case 'mid':
      return 'text-yellow-600';
    case 'senior':
      return 'text-red-600';
    default:
      return '';
  }
}
