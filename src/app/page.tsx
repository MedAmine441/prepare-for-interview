// src/app/page.tsx

import Link from "next/link";
import {
  BookOpen,
  MessageSquare,
  Library,
  TrendingUp,
  Clock,
  Target,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      {/* Hero */}
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Master Frontend Interviews
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Study with spaced repetition flashcards. Practice with AI mock interviews.
          Build real confidence.
        </p>
        <div className="flex gap-3 justify-center">
          <Button asChild size="lg">
            <Link href="/flashcards">
              <BookOpen className="w-4 h-4 mr-2" />
              Start Studying
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/interview">
              <MessageSquare className="w-4 h-4 mr-2" />
              Mock Interview
            </Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-4 mb-16">
        <FeatureCard
          icon={<BookOpen className="w-5 h-5" />}
          title="Spaced Repetition"
          description="SM-2 algorithm optimizes review intervals for long-term retention."
        />
        <FeatureCard
          icon={<MessageSquare className="w-5 h-5" />}
          title="AI Interviews"
          description="Practice with an AI that asks follow-ups and gives feedback."
        />
        <FeatureCard
          icon={<Library className="w-5 h-5" />}
          title="Curated Questions"
          description="High-quality questions across React, JS, CSS, and more."
        />
      </section>

      <Separator className="mb-16" />

      {/* Stats */}
      <section className="mb-16">
        <h2 className="text-lg font-semibold mb-6">Your Progress</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<Library className="w-4 h-4" />} value="0" label="Studied" />
          <StatCard icon={<TrendingUp className="w-4 h-4" />} value="0" label="Mastered" />
          <StatCard icon={<Clock className="w-4 h-4" />} value="0" label="Due Today" />
          <StatCard icon={<Target className="w-4 h-4" />} value="0" label="Day Streak" />
        </div>
      </section>

      {/* Categories */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Topics</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/questions">
              View all
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/flashcards/${category.slug}`}
              className="group"
            >
              <Card className="transition-colors hover:bg-secondary/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-md ${category.color} flex items-center justify-center text-white text-sm`}>
                      {category.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{category.name}</p>
                      <p className="text-xs text-muted-foreground">{category.count} questions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center mb-2">
          {icon}
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          {icon}
          <span className="text-xs">{label}</span>
        </div>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

const categories = [
  { slug: "react-internals", name: "React Internals", icon: "⚛️", color: "bg-cyan-500", count: 18 },
  { slug: "system-design", name: "System Design", icon: "🏗️", color: "bg-blue-500", count: 20 },
  { slug: "js-event-loop", name: "Event Loop", icon: "🔄", color: "bg-orange-500", count: 12 },
  { slug: "css-layout", name: "CSS & Layout", icon: "🎨", color: "bg-pink-500", count: 15 },
  { slug: "security-auth", name: "Security", icon: "🔒", color: "bg-red-500", count: 10 },
  { slug: "accessibility", name: "Accessibility", icon: "♿", color: "bg-teal-500", count: 12 },
];
