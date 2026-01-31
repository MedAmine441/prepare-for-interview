// src/app/flashcards/new/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Loader2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORY_METADATA,
  DIFFICULTY_METADATA,
} from "@/lib/constants/categories";
import { createQuestion } from "@/actions/question.actions";
import type { QuestionCategory, Difficulty } from "@/types";

interface FormErrors {
  question?: string;
  answer?: string;
  category?: string;
  difficulty?: string;
  keyPoints?: string;
}

export default function NewQuestionPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState(false);

  // Form state
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState<QuestionCategory | "">("");
  const [difficulty, setDifficulty] = useState<Difficulty>("mid");
  const [keyPoints, setKeyPoints] = useState<string[]>([""]);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([""]);
  const [relatedTopics, setRelatedTopics] = useState<string[]>([""]);

  const addArrayField = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setter((prev) => [...prev, ""]);
  };

  const removeArrayField = (
    index: number,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  const updateArrayField = (
    index: number,
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setter((prev) => prev.map((item, i) => (i === index ? value : item)));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!question.trim() || question.length < 10) {
      newErrors.question = "Question must be at least 10 characters";
    }
    if (!answer.trim() || answer.length < 50) {
      newErrors.answer = "Answer must be at least 50 characters";
    }
    if (!category) {
      newErrors.category = "Please select a category";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const formData = new FormData();
      formData.append("question", question.trim());
      formData.append("answer", answer.trim());
      formData.append("category", category);
      formData.append("difficulty", difficulty);

      // Add non-empty array fields
      keyPoints
        .filter((kp) => kp.trim())
        .forEach((kp) => formData.append("keyPoints", kp.trim()));

      followUpQuestions
        .filter((fq) => fq.trim())
        .forEach((fq) => formData.append("followUpQuestions", fq.trim()));

      relatedTopics
        .filter((rt) => rt.trim())
        .forEach((rt) => formData.append("relatedTopics", rt.trim()));

      const result = await createQuestion(formData);

      if (!result.success) {
        if (result.validationErrors) {
          setErrors(result.validationErrors as FormErrors);
        } else {
          setErrors({ question: result.error });
        }
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/questions");
      }, 1500);
    } catch (err) {
      console.error("Error creating question:", err);
      setErrors({ question: "Failed to create question. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Question Created!</h2>
          <p className="text-muted-foreground">Redirecting to questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Sub-header with breadcrumb */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link
              href="/flashcards"
              className="text-muted-foreground hover:text-foreground"
            >
              Flashcards
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">Add New Question</span>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category & Difficulty */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-red-500">*</span>
              </Label>
              <Select
                value={category}
                onValueChange={(val) => setCategory(val as QuestionCategory)}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(CATEGORY_METADATA).map((cat) => (
                    <SelectItem key={cat.slug} value={cat.slug}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-red-500">{errors.category}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select
                value={difficulty}
                onValueChange={(val) => setDifficulty(val as Difficulty)}
              >
                <SelectTrigger id="difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DIFFICULTY_METADATA).map(([key, meta]) => (
                    <SelectItem key={key} value={key}>
                      {meta.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Question */}
          <div className="space-y-2">
            <Label htmlFor="question">
              Question <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter the interview question..."
              rows={3}
              className={errors.question ? "border-red-500" : ""}
            />
            {errors.question && (
              <p className="text-sm text-red-500">{errors.question}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {question.length}/10 minimum characters
            </p>
          </div>

          {/* Answer */}
          <div className="space-y-2">
            <Label htmlFor="answer">
              Answer <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Enter the comprehensive answer (supports Markdown)..."
              rows={8}
              className={errors.answer ? "border-red-500" : ""}
            />
            {errors.answer && (
              <p className="text-sm text-red-500">{errors.answer}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {answer.length}/50 minimum characters • Markdown supported
            </p>
          </div>

          {/* Key Points (Optional) */}
          <div className="space-y-2">
            <Label>Key Points (Optional)</Label>
            <p className="text-xs text-muted-foreground mb-2">
              What should an interviewer look for in a good answer?
            </p>
            {keyPoints.map((point, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={point}
                  onChange={(e) =>
                    updateArrayField(index, e.target.value, setKeyPoints)
                  }
                  placeholder={`Key point ${index + 1}`}
                />
                {keyPoints.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeArrayField(index, setKeyPoints)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayField(setKeyPoints)}
            >
              <Plus className="w-4 h-4 mr-1" /> Add Key Point
            </Button>
          </div>

          {/* Follow-up Questions (Optional) */}
          <div className="space-y-2">
            <Label>Follow-up Questions (Optional)</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Questions an interviewer might ask to dig deeper
            </p>
            {followUpQuestions.map((fq, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={fq}
                  onChange={(e) =>
                    updateArrayField(
                      index,
                      e.target.value,
                      setFollowUpQuestions,
                    )
                  }
                  placeholder={`Follow-up question ${index + 1}`}
                />
                {followUpQuestions.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      removeArrayField(index, setFollowUpQuestions)
                    }
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayField(setFollowUpQuestions)}
            >
              <Plus className="w-4 h-4 mr-1" /> Add Follow-up
            </Button>
          </div>

          {/* Related Topics (Optional) */}
          <div className="space-y-2">
            <Label>Related Topics (Optional)</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Related concepts or topics for cross-reference
            </p>
            {relatedTopics.map((topic, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={topic}
                  onChange={(e) =>
                    updateArrayField(index, e.target.value, setRelatedTopics)
                  }
                  placeholder={`Related topic ${index + 1}`}
                />
                {relatedTopics.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeArrayField(index, setRelatedTopics)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayField(setRelatedTopics)}
            >
              <Plus className="w-4 h-4 mr-1" /> Add Topic
            </Button>
          </div>

          {/* Submit */}
          <div className="flex gap-4 pt-4 border-t">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Question
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
