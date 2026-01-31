// src/app/flashcards/new/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Loader2, X, Check, ChevronRight } from "lucide-react";
import { z } from "zod";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  CATEGORY_METADATA,
  DIFFICULTY_METADATA,
} from "@/lib/constants/categories";
import { createQuestion } from "@/actions/question.actions";
import type { QuestionCategory, Difficulty } from "@/types";

// Validation schema
const CreateQuestionSchema = z.object({
  question: z.string().min(10, "Question must be at least 10 characters"),
  answer: z.string().min(50, "Answer must be at least 50 characters"),
  category: z.string().min(1, "Please select a category"),
  difficulty: z.enum(["junior", "mid", "senior"]),
  keyPoints: z.array(z.string().min(1)).min(1, "At least one key point is required"),
  followUpQuestions: z.array(z.string()).optional(),
  relatedTopics: z.array(z.string()).optional(),
});

type FormErrors = Partial<Record<keyof z.infer<typeof CreateQuestionSchema>, string>>;

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

  const addArrayField = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => [...prev, ""]);
  };

  const removeArrayField = (
    index: number,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  const updateArrayField = (
    index: number,
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter((prev) => prev.map((item, i) => (i === index ? value : item)));
  };

  const validateForm = (): boolean => {
    // Filter out empty strings from arrays
    const filteredKeyPoints = keyPoints.filter((kp) => kp.trim() !== "");
    const filteredFollowUps = followUpQuestions.filter((fq) => fq.trim() !== "");
    const filteredTopics = relatedTopics.filter((rt) => rt.trim() !== "");

    const formData = {
      question: question.trim(),
      answer: answer.trim(),
      category,
      difficulty,
      keyPoints: filteredKeyPoints,
      followUpQuestions: filteredFollowUps,
      relatedTopics: filteredTopics,
    };

    const result = CreateQuestionSchema.safeParse(formData);

    if (!result.success) {
      const newErrors: FormErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof FormErrors;
        if (field && !newErrors[field]) {
          newErrors[field] = issue.message;
        }
      });
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
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
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-lg font-semibold mb-1">Question Created</h2>
          <p className="text-sm text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/flashcards" className="hover:text-foreground transition-colors">
          Flashcards
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground font-medium">New Question</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Add New Question</h1>
        <p className="text-muted-foreground">
          Create a custom flashcard for your study sessions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
            <CardDescription>Category and difficulty level</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={category}
                  onValueChange={(val) => {
                    setCategory(val as QuestionCategory);
                    if (errors.category) setErrors((e) => ({ ...e, category: undefined }));
                  }}
                >
                  <SelectTrigger id="category" className={errors.category ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select..." />
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
                  <p className="text-sm text-destructive">{errors.category}</p>
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
          </CardContent>
        </Card>

        {/* Question & Answer */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Question & Answer</CardTitle>
            <CardDescription>The interview question and its model answer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question">
                Question <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="question"
                value={question}
                onChange={(e) => {
                  setQuestion(e.target.value);
                  if (errors.question) setErrors((err) => ({ ...err, question: undefined }));
                }}
                placeholder="Enter the interview question..."
                rows={3}
                className={errors.question ? "border-destructive" : ""}
              />
              {errors.question && (
                <p className="text-sm text-destructive">{errors.question}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {question.length} / 10 min characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="answer">
                Answer <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="answer"
                value={answer}
                onChange={(e) => {
                  setAnswer(e.target.value);
                  if (errors.answer) setErrors((err) => ({ ...err, answer: undefined }));
                }}
                placeholder="Enter the comprehensive answer (Markdown supported)..."
                rows={8}
                className={errors.answer ? "border-destructive" : ""}
              />
              {errors.answer && (
                <p className="text-sm text-destructive">{errors.answer}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {answer.length} / 50 min characters · Markdown supported
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Key Points */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Key Points <span className="text-destructive">*</span>
            </CardTitle>
            <CardDescription>
              What should an interviewer look for in a good answer?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {keyPoints.map((point, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={point}
                  onChange={(e) => {
                    updateArrayField(index, e.target.value, setKeyPoints);
                    if (errors.keyPoints) setErrors((err) => ({ ...err, keyPoints: undefined }));
                  }}
                  placeholder={`Key point ${index + 1}`}
                  className={errors.keyPoints && index === 0 ? "border-destructive" : ""}
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
            {errors.keyPoints && (
              <p className="text-sm text-destructive">{errors.keyPoints}</p>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayField(setKeyPoints)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Key Point
            </Button>
          </CardContent>
        </Card>

        {/* Optional Fields */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Additional Details</CardTitle>
            <CardDescription>Optional follow-up questions and related topics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Follow-up Questions */}
            <div className="space-y-3">
              <Label>Follow-up Questions</Label>
              {followUpQuestions.map((fq, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={fq}
                    onChange={(e) =>
                      updateArrayField(index, e.target.value, setFollowUpQuestions)
                    }
                    placeholder={`Follow-up question ${index + 1}`}
                  />
                  {followUpQuestions.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeArrayField(index, setFollowUpQuestions)}
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
                <Plus className="w-4 h-4 mr-1" />
                Add Follow-up
              </Button>
            </div>

            <Separator />

            {/* Related Topics */}
            <div className="space-y-3">
              <Label>Related Topics</Label>
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
                <Plus className="w-4 h-4 mr-1" />
                Add Topic
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
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
    </div>
  );
}
