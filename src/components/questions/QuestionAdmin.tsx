// src/components/questions/QuestionAdmin.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Loader2, Pencil, Trash2, X } from "lucide-react";
import {
  updateQuestion,
  archiveQuestion,
  restoreQuestion,
  deleteQuestion,
} from "@/actions/question.actions";
import { CATEGORY_METADATA } from "@/lib/constants/categories";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Question, Difficulty } from "@/types";

interface QuestionAdminProps {
  question: Question;
}

/**
 * Edit / archive / delete controls for a question.
 * Seed questions can only be archived — deleting one is pointless since
 * `npm run seed` would re-add it under the same positional id.
 */
export function QuestionAdmin({ question }: QuestionAdminProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Draft fields (arrays edited as one-per-line text)
  const [draftQuestion, setDraftQuestion] = useState(question.question);
  const [draftAnswer, setDraftAnswer] = useState(question.answer);
  const [draftKeyPoints, setDraftKeyPoints] = useState(
    question.keyPoints.join("\n"),
  );
  const [draftFollowUps, setDraftFollowUps] = useState(
    question.followUpQuestions.join("\n"),
  );
  const [draftTopics, setDraftTopics] = useState(
    question.relatedTopics.join("\n"),
  );
  const [draftCategory, setDraftCategory] = useState(question.category);
  const [draftDifficulty, setDraftDifficulty] = useState<Difficulty>(
    question.difficulty,
  );

  const lines = (text: string) =>
    text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

  const handleSave = async () => {
    setIsBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("id", question.id);
      formData.append("category", draftCategory);
      formData.append("difficulty", draftDifficulty);
      formData.append("question", draftQuestion);
      formData.append("answer", draftAnswer);
      lines(draftKeyPoints).forEach((p) => formData.append("keyPoints", p));
      lines(draftFollowUps).forEach((p) => formData.append("followUpQuestions", p));
      lines(draftTopics).forEach((p) => formData.append("relatedTopics", p));

      const result = await updateQuestion(formData);
      if (!result.success) {
        setError(
          result.validationErrors
            ? Object.values(result.validationErrors).join(" · ")
            : result.error,
        );
        return;
      }
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Failed to save changes");
    } finally {
      setIsBusy(false);
    }
  };

  const handleArchiveToggle = async () => {
    setIsBusy(true);
    setError(null);
    try {
      const result = question.isArchived
        ? await restoreQuestion(question.id)
        : await archiveQuestion(question.id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    } finally {
      setIsBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setIsBusy(true);
    setError(null);
    try {
      const result = await deleteQuestion(question.id);
      if (!result.success) {
        setError(result.error);
        setConfirmDelete(false);
        return;
      }
      router.push("/questions");
    } finally {
      setIsBusy(false);
    }
  };

  if (!isEditing) {
    return (
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditing(true)}
            disabled={isBusy}
          >
            <Pencil className="w-3.5 h-3.5 mr-1.5" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleArchiveToggle}
            disabled={isBusy}
            title={
              question.isArchived
                ? "Bring this question back into the bank"
                : "Hide from the library and study queues (reversible)"
            }
          >
            {question.isArchived ? (
              <>
                <ArchiveRestore className="w-3.5 h-3.5 mr-1.5" />
                Restore
              </>
            ) : (
              <>
                <Archive className="w-3.5 h-3.5 mr-1.5" />
                Archive
              </>
            )}
          </Button>
          {question.source !== "seed" && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleDelete}
              disabled={isBusy}
              className="text-red-600 border-red-300 hover:bg-red-500/10 dark:text-red-400 dark:border-red-900"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              {confirmDelete ? "Really delete?" : "Delete"}
            </Button>
          )}
          {confirmDelete && (
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          )}
        </div>
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-2">{error}</p>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">Edit Question</CardTitle>
        <button
          onClick={() => setIsEditing(false)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Cancel editing"
        >
          <X className="w-4 h-4" />
        </button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">
              Category
            </span>
            <select
              value={draftCategory}
              onChange={(e) => setDraftCategory(e.target.value as never)}
              className="mt-1 w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {Object.values(CATEGORY_METADATA).map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">
              Difficulty
            </span>
            <select
              value={draftDifficulty}
              onChange={(e) => setDraftDifficulty(e.target.value as Difficulty)}
              className="mt-1 w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="junior">Junior</option>
              <option value="mid">Mid-Level</option>
              <option value="senior">Senior</option>
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">
            Question
          </span>
          <textarea
            value={draftQuestion}
            onChange={(e) => setDraftQuestion(e.target.value)}
            rows={2}
            className="mt-1 w-full p-3 rounded-md border bg-background text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">
            Key points — one per line (these are the flashcard quick answer)
          </span>
          <textarea
            value={draftKeyPoints}
            onChange={(e) => setDraftKeyPoints(e.target.value)}
            rows={5}
            className="mt-1 w-full p-3 rounded-md border bg-background text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">
            Full answer (markdown)
          </span>
          <textarea
            value={draftAnswer}
            onChange={(e) => setDraftAnswer(e.target.value)}
            rows={12}
            className="mt-1 w-full p-3 rounded-md border bg-background font-mono text-xs leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">
              Follow-up questions — one per line
            </span>
            <textarea
              value={draftFollowUps}
              onChange={(e) => setDraftFollowUps(e.target.value)}
              rows={3}
              className="mt-1 w-full p-3 rounded-md border bg-background text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">
              Related topics — one per line, kebab-case
            </span>
            <textarea
              value={draftTopics}
              onChange={(e) => setDraftTopics(e.target.value)}
              rows={3}
              className="mt-1 w-full p-3 rounded-md border bg-background text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
        </div>

        {error && (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={isBusy}>
            {isBusy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsEditing(false)}
            disabled={isBusy}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
