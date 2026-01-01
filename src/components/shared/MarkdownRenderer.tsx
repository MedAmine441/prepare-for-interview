// src/components/shared/MarkdownRenderer.tsx

'use client';

import { useMemo } from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Simple Markdown renderer that handles:
 * - Headers (##, ###)
 * - Bold (**text**)
 * - Italic (*text*)
 * - Code blocks (```code```)
 * - Inline code (`code`)
 * - Lists (- item)
 * - Links ([text](url))
 * - Blockquotes (> text)
 * 
 * For production, consider using react-markdown with remark/rehype plugins
 */
export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const html = useMemo(() => {
    return parseMarkdown(content);
  }, [content]);

  return (
    <div 
      className={`markdown-content ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function parseMarkdown(markdown: string): string {
  if (!markdown) return '';

  let html = markdown;

  // Escape HTML to prevent XSS
  html = escapeHtml(html);

  // Code blocks (must be done before inline code)
  html = html.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    (_, lang, code) => {
      const decoded = unescapeHtml(code.trim());
      return `<pre class="bg-muted rounded-lg p-4 overflow-x-auto my-4"><code class="language-${lang || 'text'} text-sm">${decoded}</code></pre>`;
    }
  );

  // Inline code
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>'
  );

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-6 mb-2">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>');

  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Blockquotes
  html = html.replace(
    /^&gt; (.+)$/gm,
    '<blockquote class="border-l-4 border-muted pl-4 my-4 text-muted-foreground">$1</blockquote>'
  );

  // Unordered lists
  html = html.replace(
    /^- (.+)$/gm,
    '<li class="ml-4">$1</li>'
  );
  // Wrap consecutive li elements in ul
  html = html.replace(
    /(<li[^>]*>.*<\/li>\n?)+/g,
    '<ul class="list-disc list-inside my-2 space-y-1">$&</ul>'
  );

  // Numbered lists
  html = html.replace(
    /^\d+\. (.+)$/gm,
    '<li class="ml-4">$1</li>'
  );

  // Tables (basic support)
  html = html.replace(
    /^\|(.+)\|$/gm,
    (match, content) => {
      const cells = content.split('|').map((cell: string) => cell.trim());
      const isHeader = cells.every((cell: string) => cell.match(/^-+$/));
      
      if (isHeader) {
        return ''; // Skip separator row
      }
      
      const tag = 'td';
      const cellsHtml = cells.map((cell: string) => `<${tag} class="border px-3 py-2">${cell}</${tag}>`).join('');
      return `<tr>${cellsHtml}</tr>`;
    }
  );
  // Wrap table rows
  html = html.replace(
    /(<tr>.*<\/tr>\n?)+/g,
    '<table class="border-collapse border my-4 w-full">$&</table>'
  );

  // Paragraphs - wrap non-wrapped text
  html = html
    .split('\n\n')
    .map(para => {
      const trimmed = para.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<')) return trimmed;
      return `<p class="my-2">${trimmed}</p>`;
    })
    .join('\n');

  // Line breaks
  html = html.replace(/\n/g, '<br>');
  // Remove excessive br after block elements
  html = html.replace(/(<\/(?:h[1-6]|p|pre|ul|ol|li|blockquote|table|tr)>)<br>/g, '$1');
  html = html.replace(/<br>(<(?:h[1-6]|p|pre|ul|ol|li|blockquote|table))/g, '$1');

  return html;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, char => map[char]);
}

function unescapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
  };
  return text.replace(/&(?:amp|lt|gt|quot|#039);/g, entity => map[entity] || entity);
}
