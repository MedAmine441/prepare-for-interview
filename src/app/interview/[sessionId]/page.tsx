// src/app/interview/[sessionId]/page.tsx

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { InterviewChat } from "@/components/interview/InterviewChat";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface SessionPageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default async function InterviewSessionPage({ params }: SessionPageProps) {
  const { sessionId } = await params;

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Header */}
      <div className="shrink-0 border-b">
        <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-4xl">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/interview">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Exit
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <span className="text-sm font-medium">Mock Interview</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span>Connected</span>
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-hidden">
        <InterviewChat sessionId={sessionId} />
      </div>
    </div>
  );
}
