// src/components/interview/InterviewChat.tsx

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Send, Loader2, Flag, Target, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';
import { Button } from '@/components/ui/button';
import {
  saveInterviewTranscript,
  completeInterview,
  type InterviewAnalysisResult,
} from '@/actions/interview.actions';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type AnalysisState =
  | { status: 'loading' }
  | { status: 'done'; result: InterviewAnalysisResult }
  | { status: 'error'; error: string };

/**
 * Minimal Web Speech API surface — SpeechRecognition is Chrome-only
 * (webkit-prefixed) and absent from TypeScript's dom lib.
 */
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult:
    | ((event: {
        resultIndex: number;
        results: ArrayLike<
          ArrayLike<{ transcript: string }> & { isFinal: boolean }
        >;
      }) => void)
    | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

const VOICE_MODE_STORAGE_KEY = 'fm-voice-mode';

/** Make markdown listenable: drop code blocks and formatting characters */
function stripForSpeech(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' Code example omitted. ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/[*_#>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

interface InterviewChatProps {
  sessionId: string;
  /** Full interviewer system prompt, built server-side from the session config */
  systemPrompt: string;
  /**
   * Deterministic opening message (greeting + first bank question).
   * When null the model is asked to open the interview itself.
   */
  openingMessage: string | null;
}

const END_INTERVIEW_INSTRUCTION =
  'I would like to end the interview here. Please give me the overall debrief now: my strengths, my top 3 gaps, and the specific topics I should study next.';

export function InterviewChat({ sessionId, systemPrompt, openingMessage }: InterviewChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [hasEnded, setHasEnded] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisState | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bootstrappedRef = useRef(false);

  // Voice mode: hear the interviewer, dictate your answers
  const [voiceMode, setVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const wantListeningRef = useRef(false);
  const pausedForSpeechRef = useRef(false);
  const lastSpokenIdRef = useRef<string | null>(null);

  useEffect(() => {
    setVoiceMode(localStorage.getItem(VOICE_MODE_STORAGE_KEY) === '1');
  }, []);

  const ensureRecognition = useCallback((): SpeechRecognitionLike | null => {
    if (recognitionRef.current) return recognitionRef.current;
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) {
      setSpeechSupported(false);
      return null;
    }
    const rec = new Ctor();
    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (event) => {
      let interimText = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0]?.transcript ?? '';
        if (event.results[i].isFinal) finalText += transcript;
        else interimText += transcript;
      }
      if (finalText.trim()) {
        setInput((prev) => (prev ? `${prev} ` : '') + finalText.trim());
      }
      setInterim(interimText);
    };
    rec.onend = () => {
      setIsListening(false);
      setInterim('');
      // Chrome stops after silence — keep going until the user says stop
      if (wantListeningRef.current && !pausedForSpeechRef.current) {
        try {
          rec.start();
          setIsListening(true);
        } catch {
          // Already started or torn down
        }
      }
    };
    rec.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        wantListeningRef.current = false;
        setSpeechSupported(false);
      }
    };
    recognitionRef.current = rec;
    return rec;
  }, []);

  const startListening = useCallback(() => {
    const rec = ensureRecognition();
    if (!rec) return;
    wantListeningRef.current = true;
    pausedForSpeechRef.current = false;
    try {
      rec.start();
      setIsListening(true);
    } catch {
      // start() throws if already running
    }
  }, [ensureRecognition]);

  const stopListening = useCallback(() => {
    wantListeningRef.current = false;
    pausedForSpeechRef.current = false;
    recognitionRef.current?.stop();
    setIsListening(false);
    setInterim('');
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(stripForSpeech(text));
    utterance.rate = 1.05;
    // Mute the mic while the interviewer talks so it doesn't hear itself
    utterance.onstart = () => {
      if (wantListeningRef.current && recognitionRef.current) {
        pausedForSpeechRef.current = true;
        recognitionRef.current.stop();
      }
    };
    utterance.onend = () => {
      if (pausedForSpeechRef.current) {
        pausedForSpeechRef.current = false;
        if (wantListeningRef.current) {
          try {
            recognitionRef.current?.start();
            setIsListening(true);
          } catch {
            // Already started
          }
        }
      }
    };
    window.speechSynthesis.speak(utterance);
  }, []);

  // Read each new interviewer message aloud in voice mode
  useEffect(() => {
    if (!voiceMode) return;
    const last = messages[messages.length - 1];
    if (last && last.role === 'assistant' && lastSpokenIdRef.current !== last.id) {
      lastSpokenIdRef.current = last.id;
      speak(last.content);
    }
  }, [messages, voiceMode, speak]);

  const toggleVoiceMode = useCallback(() => {
    const next = !voiceMode;
    localStorage.setItem(VOICE_MODE_STORAGE_KEY, next ? '1' : '0');
    if (next) {
      // Don't replay the reply that's already on screen
      const lastAssistant = [...messages]
        .reverse()
        .find((m) => m.role === 'assistant');
      lastSpokenIdRef.current = lastAssistant?.id ?? null;
    } else {
      window.speechSynthesis?.cancel();
      stopListening();
    }
    setVoiceMode(next);
  }, [voiceMode, messages, stopListening]);

  // Tear down audio when leaving the page
  useEffect(() => {
    return () => {
      wantListeningRef.current = false;
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  const sendToModel = useCallback(
    async (
      history: Message[],
      userContent: string,
      options: { hidden?: boolean } = {},
    ): Promise<string | null> => {
      setIsLoading(true);
      setStreamingContent('');

      const userMessage: Message = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: userContent,
        timestamp: new Date(),
      };
      // Hidden instructions (bootstrap, end-of-interview) stay out of the
      // visible chat and the persisted transcript
      const visibleTurn = options.hidden ? [...history] : [...history, userMessage];

      if (!options.hidden) {
        setMessages((prev) => [...prev, userMessage]);
      }

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: systemPrompt },
              ...history.map((m) => ({ role: m.role, content: m.content })),
              { role: 'user', content: userContent },
            ],
            stream: true,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get response');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = '';
        let buffer = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Buffer across reads — SSE frames can be split mid-line
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  accumulatedContent += data.content;
                  setStreamingContent(accumulatedContent);
                }
              } catch {
                // Ignore malformed frames
              }
            }
          }
        }

        if (accumulatedContent) {
          const assistantMessage: Message = {
            id: `a-${Date.now()}`,
            role: 'assistant',
            content: accumulatedContent,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);

          // Persist the transcript so the session survives navigation
          const finalTranscript = [...visibleTurn, assistantMessage];
          saveInterviewTranscript(
            sessionId,
            finalTranscript.map((m) => ({ role: m.role, content: m.content })),
          ).catch((err) => console.error('Failed to save transcript:', err));
        } else {
          throw new Error('Empty response');
        }
        setStreamingContent('');
        return accumulatedContent;
      } catch (error) {
        console.error('Chat error:', error);
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: 'assistant',
            content:
              'Sorry, I ran into an error talking to the AI. Check that your API key is configured, then send your answer again.',
            timestamp: new Date(),
          },
        ]);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [systemPrompt, sessionId],
  );

  // Open the interview: deterministic bank opening, or ask the model to start
  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    if (openingMessage) {
      setMessages([
        {
          id: 'initial',
          role: 'assistant',
          content: openingMessage,
          timestamp: new Date(),
        },
      ]);
    } else {
      sendToModel([], 'Please greet me briefly and ask the first interview question.', {
        hidden: true,
      });
    }
  }, [sessionId, openingMessage, sendToModel]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || hasEnded) return;
    const content = input.trim();
    setInput('');
    await sendToModel(messages, content);
  };

  const handleEndInterview = async () => {
    if (isLoading || hasEnded) return;
    setHasEnded(true);
    const debrief = await sendToModel(messages, END_INTERVIEW_INSTRUCTION, {
      hidden: true,
    });

    // Close the loop: persist the debrief and turn transcript gaps into
    // due flashcards
    setAnalysis({ status: 'loading' });
    try {
      const result = await completeInterview(sessionId, debrief ?? '');
      if (result.success) {
        setAnalysis({ status: 'done', result: result.data });
      } else {
        setAnalysis({ status: 'error', error: result.error });
      }
    } catch (err) {
      console.error(err);
      setAnalysis({ status: 'error', error: 'Failed to analyze the interview' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* Streaming message */}
        {streamingContent && (
          <MessageBubble
            message={{
              id: 'streaming',
              role: 'assistant',
              content: streamingContent,
              timestamp: new Date(),
            }}
          />
        )}

        {/* Loading indicator */}
        {isLoading && !streamingContent && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        {hasEnded ? (
          <div className="py-2 space-y-3">
            {analysis?.status === 'loading' && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing your answers to find weak spots...
              </div>
            )}
            {analysis?.status === 'error' && (
              <p className="text-sm text-muted-foreground text-center">
                {analysis.error} — the debrief above still has your feedback.
              </p>
            )}
            {analysis?.status === 'done' &&
              analysis.result.analyzed &&
              (analysis.result.weakQuestions.length > 0 ? (
                <div className="max-w-lg mx-auto">
                  <p className="text-sm font-medium text-center mb-2">
                    <Target className="w-4 h-4 inline mr-1.5 text-orange-600 dark:text-orange-400" />
                    {analysis.result.weakQuestions.length} weak spot
                    {analysis.result.weakQuestions.length > 1 ? 's' : ''} added to
                    your review queue
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1 mb-1">
                    {analysis.result.weakQuestions.map((q) => (
                      <li key={q.id} className="truncate">
                        • {q.question}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center">
                  No major gaps found — solid interview ({analysis.result.strongCount}{' '}
                  strong, {analysis.result.okCount} partial).
                </p>
              ))}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {analysis?.status === 'done' &&
                analysis.result.weakQuestions.length > 0 && (
                  <Button asChild size="sm">
                    <Link
                      href={`/flashcards/study?mode=practice&ids=${analysis.result.weakQuestions
                        .map((q) => q.id)
                        .join(',')}`}
                    >
                      Cram Weak Spots Now
                    </Link>
                  </Button>
                )}
              <Button
                asChild
                size="sm"
                variant={
                  analysis?.status === 'done' &&
                  analysis.result.weakQuestions.length > 0
                    ? 'outline'
                    : 'default'
                }
              >
                <Link href="/interview">Start a New Interview</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/interview/history">Past Sessions</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <form onSubmit={handleSubmit} className="flex gap-2">
              {voiceMode && (
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  disabled={!speechSupported}
                  className={`px-4 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isListening
                      ? 'bg-red-500/10 border-red-500/40 text-red-600 dark:text-red-400'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}
                  title={isListening ? 'Stop the microphone' : 'Answer by speaking'}
                  aria-label={isListening ? 'Stop listening' : 'Start speaking'}
                >
                  {isListening ? (
                    <Mic className="w-5 h-5 animate-pulse" />
                  ) : (
                    <MicOff className="w-5 h-5" />
                  )}
                </button>
              )}
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  voiceMode
                    ? 'Speak or type your answer...'
                    : 'Type your answer... (Shift+Enter for new line)'
                }
                rows={3}
                className="flex-1 p-3 rounded-lg border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isLoading}
              />
              <div className="flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="flex-1 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Send answer"
                >
                  <Send className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={toggleVoiceMode}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    voiceMode
                      ? 'bg-primary/10 border-primary/30 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}
                  title="Voice mode — hear the interviewer and answer by speaking"
                  aria-label="Toggle voice mode"
                >
                  {voiceMode ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <VolumeX className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleEndInterview}
                  disabled={isLoading || messages.length < 2}
                  className="px-4 py-2 rounded-lg border text-muted-foreground hover:text-foreground hover:bg-secondary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="End the interview and get your debrief"
                  aria-label="End interview and get feedback"
                >
                  <Flag className="w-4 h-4" />
                </button>
              </div>
            </form>
            {voiceMode && (
              <p className="text-xs text-muted-foreground mt-2 min-h-4 italic truncate">
                {!speechSupported
                  ? 'Speech recognition is unavailable — check mic permissions (Chrome required).'
                  : isListening
                    ? interim || 'Listening... speak your answer, then hit send.'
                    : 'Voice mode on — tap the mic to answer out loud.'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted rounded-bl-md'
        }`}
      >
        <MarkdownRenderer content={message.content} />
        <div className={`text-xs mt-1 ${isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}
