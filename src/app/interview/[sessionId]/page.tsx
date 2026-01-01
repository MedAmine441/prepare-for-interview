// src/app/interview/[sessionId]/page.tsx

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { InterviewChat } from '@/components/interview/InterviewChat';

interface SessionPageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default async function InterviewSessionPage({ params }: SessionPageProps) {
  const { sessionId } = await params;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b shrink-0">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/interview" 
              className="p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-semibold">Mock Interview</h1>
              <p className="text-xs text-muted-foreground">Session in progress</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Connected
          </div>
        </div>
      </header>

      {/* Chat Interface */}
      <main className="flex-1 overflow-hidden">
        <InterviewChat sessionId={sessionId} />
      </main>
    </div>
  );
}
