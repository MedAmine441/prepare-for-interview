// src/app/questions/page.tsx

import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowLeft, Search, Filter } from 'lucide-react';
import { QuestionList } from '@/components/questions/QuestionList';

export default function QuestionsPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-semibold text-lg">Question Library</h1>
              <p className="text-sm text-muted-foreground">Browse all interview questions</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search questions..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-accent transition-colors">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Question List */}
        <Suspense fallback={<QuestionListSkeleton />}>
          <QuestionList />
        </Suspense>
      </main>
    </div>
  );
}

function QuestionListSkeleton() {
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
