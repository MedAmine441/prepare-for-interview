// src/app/page.tsx

import Link from 'next/link';
import { 
  BookOpen, 
  MessageSquare, 
  Library, 
  TrendingUp,
  Clock,
  Target
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">F</span>
            </div>
            <span className="font-semibold text-xl">FrontMaster</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link 
              href="/flashcards" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Flashcards
            </Link>
            <Link 
              href="/interview" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Interview
            </Link>
            <Link 
              href="/questions" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Questions
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-balance">
          Master Frontend Interviews with
          <span className="text-primary"> Spaced Repetition</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Practice real interview questions, study with scientifically-proven 
          flashcards, and simulate mock interviews with AI.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/flashcards"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <BookOpen className="w-5 h-5" />
            Start Studying
          </Link>
          <Link
            href="/interview"
            className="inline-flex items-center gap-2 px-6 py-3 border rounded-lg font-medium hover:bg-accent transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            Mock Interview
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<BookOpen className="w-6 h-6" />}
            title="Spaced Repetition"
            description="Study with the SM-2 algorithm used by Anki. Review cards at optimal intervals for maximum retention."
          />
          <FeatureCard
            icon={<MessageSquare className="w-6 h-6" />}
            title="AI Mock Interviews"
            description="Practice with an AI interviewer that asks follow-up questions and provides detailed feedback."
          />
          <FeatureCard
            icon={<Library className="w-6 h-6" />}
            title="Curated Questions"
            description="High-quality questions covering React, JavaScript, CSS, System Design, Security, and more."
          />
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-card rounded-xl border p-8">
          <h2 className="text-2xl font-bold mb-8 text-center">Your Progress</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard
              icon={<Library className="w-5 h-5 text-primary" />}
              value="0"
              label="Questions Studied"
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5 text-green-500" />}
              value="0"
              label="Cards Mastered"
            />
            <StatCard
              icon={<Clock className="w-5 h-5 text-yellow-500" />}
              value="0"
              label="Due Today"
            />
            <StatCard
              icon={<Target className="w-5 h-5 text-purple-500" />}
              value="0"
              label="Day Streak"
            />
          </div>
        </div>
      </section>

      {/* Categories Preview */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold mb-8">Topics Covered</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/flashcards/${category.slug}`}
              className="p-4 rounded-lg border hover:border-primary hover:shadow-sm transition-all"
            >
              <div className={`w-10 h-10 rounded-lg ${category.color} flex items-center justify-center mb-3`}>
                <span className="text-white text-lg">{category.icon}</span>
              </div>
              <h3 className="font-medium">{category.name}</h3>
              <p className="text-sm text-muted-foreground">{category.count} questions</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>Built for learning. Powered by spaced repetition.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <div className="p-6 rounded-xl border bg-card">
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function StatCard({ 
  icon, 
  value, 
  label 
}: { 
  icon: React.ReactNode; 
  value: string; 
  label: string;
}) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-muted mb-2">
        {icon}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

const categories = [
  { slug: 'react-internals', name: 'React Internals', icon: '⚛️', color: 'bg-cyan-500', count: 18 },
  { slug: 'system-design', name: 'System Design', icon: '🏗️', color: 'bg-blue-500', count: 20 },
  { slug: 'js-event-loop', name: 'Event Loop', icon: '🔄', color: 'bg-orange-500', count: 12 },
  { slug: 'css-layout', name: 'CSS & Layout', icon: '🎨', color: 'bg-pink-500', count: 15 },
  { slug: 'caching-memoization', name: 'Caching', icon: '💾', color: 'bg-green-500', count: 12 },
  { slug: 'security-auth', name: 'Security', icon: '🔒', color: 'bg-red-500', count: 10 },
  { slug: 'accessibility', name: 'Accessibility', icon: '♿', color: 'bg-teal-500', count: 12 },
  { slug: 'bundle-tree-shaking', name: 'Bundling', icon: '📦', color: 'bg-yellow-500', count: 10 },
  { slug: 'feature-flags', name: 'Feature Flags', icon: '🚩', color: 'bg-purple-500', count: 8 },
];
