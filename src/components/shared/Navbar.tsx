// src/components/shared/Navbar.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

export function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={32} />
          <span className="font-semibold text-xl">FrontMaster</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/flashcards"
            className={`transition-colors ${
              isActive("/flashcards")
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Flashcards
          </Link>
          <Link
            href="/interview"
            className={`transition-colors ${
              isActive("/interview")
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Interview
          </Link>
          <Link
            href="/questions"
            className={`transition-colors ${
              isActive("/questions")
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Questions
          </Link>
        </nav>
      </div>
    </header>
  );
}
