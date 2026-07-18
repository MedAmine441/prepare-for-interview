// src/app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';

const KIMI_API_KEY = process.env.KIMI_API_KEY;
const KIMI_BASE_URL = process.env.KIMI_BASE_URL || 'https://api.moonshot.ai/v1';
const KIMI_MODEL = process.env.KIMI_MODEL || 'kimi-k2.6';

export async function POST(request: NextRequest) {
  try {
    const { messages, stream = true } = await request.json();

    if (!KIMI_API_KEY) {
      return NextResponse.json(
        { error: 'KIMI_API_KEY not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIMI_API_KEY}`,
      },
      body: JSON.stringify({
        model: KIMI_MODEL,
        messages,
        stream,
        // No temperature override — kimi-k2.6 only accepts its default (1)
        // Reasoning models spend part of the budget thinking before answering,
        // so leave generous headroom for the visible reply
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Kimi API error:', error);
      return NextResponse.json(
        { error: 'Failed to get response from AI' },
        { status: response.status }
      );
    }

    if (stream) {
      // Re-emit upstream SSE as simplified {content} frames
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      const readableStream = new ReadableStream({
        async start(controller) {
          const reader = response.body?.getReader();
          if (!reader) {
            controller.close();
            return;
          }

          let buffer = '';
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              // Buffer across reads — SSE frames can arrive split mid-line
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith('data: ')) continue;

                const data = trimmed.slice(6);
                if (data === '[DONE]') {
                  controller.close();
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                  }
                } catch {
                  // Ignore malformed frames
                }
              }
            }
          } catch (error) {
            console.error('Stream error:', error);
          } finally {
            try {
              controller.close();
            } catch {
              // Already closed
            }
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Return regular JSON response
      const data = await response.json();
      return NextResponse.json({
        content: data.choices?.[0]?.message?.content || '',
      });
    }
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
