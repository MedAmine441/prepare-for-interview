// src/components/questions/QuestionList.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Clock } from 'lucide-react';
import type { Question } from '@/types';

export function QuestionList() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // TODO: Fetch questions from database
  useEffect(() => {
    // Simulated loading
    setTimeout(() => {
      setIsLoading(false);
      setQuestions([]);
    }, 500);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 rounded-lg border animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-3"></div>
            <div className="h-3 bg-muted rounded w-1/4"></div>
          </div>
        ))}
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
          npx tsx scripts/seed.ts
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
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className={`px-2 py-0.5 rounded-full text-xs ${getCategoryBadgeClass(question.category)}`}>
              {formatCategory(question.category)}
            </span>
            <span className={`capitalize ${getDifficultyColor(question.difficulty)}`}>
              {question.difficulty}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              ~5 min
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
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getCategoryBadgeClass(category: string): string {
  const colors: Record<string, string> = {
    'system-design': 'bg-blue-100 text-blue-800',
    'caching-memoization': 'bg-green-100 text-green-800',
    'bundle-tree-shaking': 'bg-yellow-100 text-yellow-800',
    'security-auth': 'bg-red-100 text-red-800',
    'feature-flags': 'bg-purple-100 text-purple-800',
    'css-layout': 'bg-pink-100 text-pink-800',
    'js-event-loop': 'bg-orange-100 text-orange-800',
    'accessibility': 'bg-teal-100 text-teal-800',
    'react-internals': 'bg-cyan-100 text-cyan-800',
  };
  return colors[category] || 'bg-muted text-muted-foreground';
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
