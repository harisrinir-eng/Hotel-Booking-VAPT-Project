# REPORT NOTES
## Vulnerability Assessment of a Hotel Booking Web Application using OWASP ZAP
### Advanced Software Testing — Mini Project / Seminar Case Study

---

## 1. OBJECTIVE

To design and develop a simple hotel booking web application, intentionally embed a set of controlled security vulnerabilities commonly identified in OWASP Top 10, and perform a structured vulnerability assessment using OWASP ZAP as the primary testing tool. The project aims to:

- Demonstrate the presence and exploitability of XSS, IDOR, and Open Redirect vulnerabilities in an insecure web application.
- Apply mitigation techniques (input sanitization, access tokens, redirect validation) in a secure version.
- Compare both versions using OWASP ZAP scan results and manual testing.

---

## 2. ABSTRACT

Web application security is a critical concern in modern software development. This project presents a dual-mode hotel booking web application built using React (frontend) and Flask/SQLite (backend). The insecure version of the application deliberately contains three classes of vulnerabilities: Cross-Site Scripting (XSS), Insecure Direct Object Reference (IDOR), and Open Redirect. These vulnerabilities are assessed using OWASP ZAP (Zed Attack Proxy) through automated passive/active scanning and manual exploit testing. The secure version of the same application implements corresponding mitigations — HTML sanitization, owner-token-based access control, and redirect URL allowlisting. The comparison between the two versions provides a practical, end-to-end demonstration of the VAPT lifecycle in an academic setting.

---

## 3. INTRODUCTION

Web applications are increasingly targeted by attackers due to their public-facing nature and the sensitive data they handle. The Open Web Application Security Project (OWASP) maintains a widely referenced list of the most critical web application security risks — the OWASP Top 10. Among these, injection attacks (including XSS), broken access control (including IDOR), and unvalidated redirects represent perennial and high-impact vulnerabilities.

Hotel booking systems are a common category of web application that handle sensitive user data including personal details and payment information. They represent an ideal case study for security assessment because they involve multiple user-facing inputs, object retrieval by ID, and navigation flows involving redirects — all prime surfaces for the vulnerability types under study.

This project focuses on:
1. Building a realistic (though simplified) hotel booking application.
2. Intentionally weakening its security for educational demonstration.
3. Using OWASP ZAP to identify and document these weaknesses.
4. Implementing and verifying secure coding mitigations.

---

## 4. EXISTING SYSTEM

Traditional hotel booking systems, and many web applications in general, suffer from a range of security weaknesses due to:

- **Insufficient input validation**: User inputs accepted and processed without validation or sanitization, enabling injection of malicious scripts.
- **Lack of access control**: Resources identified by sequential numeric IDs accessible to any authenticated (or unauthenticated) user.
- **Blind redirect handling**: Post-login or post-payment redirect flows that blindly follow a user-supplied URL without validation.
- **Missing security headers**: No Content-Security-Policy, X-Frame-Options, or similar headers that reduce attack surface.
- **Verbose error messages**: Error responses that reveal internal structure or data.

These weaknesses are well-documented in OWASP Top 10 under categories:
- **A03: Injection** (includes XSS)
- **A01: Broken Access Control** (includes IDOR)
- **A10: Server-Side Request Forgery** (adjacent to Open Redirect)

---

## 5. PROPOSED SYSTEM

This project proposes a dual-mode hotel booking web application structured as follows:

### Insecure Version
- Accepts user input in forms (name, special requests, reviews, search query) and processes/stores it without any sanitization.
- Retrieves bookings by a simple sequential integer ID with no ownership verification.
- Processes redirect requests with any user-supplied URL without validation.
- Renders stored data back to the browser using `dangerouslySetInnerHTML` — the React escape hatch that bypasses automatic HTML encoding.

### Secure Version
- Sanitizes all text inputs using the `bleach` Python library (strips all HTML tags).
- Assigns each booking a cryptographically random 256-bit owner token (via `secrets.token_urlsafe`). All subsequent booking access (view, cancel, pay) requires this token in a request header.
- Validates redirect targets against an allowlist of trusted hostnames; rejects external URLs with HTTP 400.
- Renders all user-supplied content via standard React JSX text interpolation (which auto-escapes HTML).
- Adds security headers (CSP, X-Content-Type-Options, X-Frame-Options) to all API responses.
- Restricts CORS to the known frontend origin.

---

## 6. METHODOLOGY

The VAPT methodology followed in this project aligns with a standard penetration testing lifecycle:

### Phase 1: Planning and Reconnaissance
- Define the scope: local application, three vulnerability classes.
- Identify attack surfaces: search inputs, booking form, booking ID URL, redirect parameter.

### Phase 2: Application Development (Insecure)
- Build the hotel booking application with React + Flask + SQLite.
- Intentionally leave input fields unsanitized.
- Use raw integer IDs for booking lookups without ownership checks.
- Implement an open redirect endpoint with no URL validation.

### Phase 3: Vulnerability Assessment (OWASP ZAP)
- **Passive Scan**: ZAP spiders the application and identifies issues without sending attack traffic.
- **Active Scan**: ZAP sends attack probes (XSS payloads, path traversal, parameter fuzzing).
- **Manual Testing**: Use ZAP's manual request editor and intercept proxy to test specific payloads.
- **Report Generation**: Export ZAP findings as an HTML or PDF report.

### Phase 4: Mitigation Implementation
- Develop the secure version of the application.
- Apply fixes for each identified vulnerability.
- Re-scan with ZAP to confirm reduced attack surface.

### Phase 5: Comparison and Documentation
- Side-by-side comparison of insecure vs. secure behavior for each vulnerability.
- Document findings, fixes, and residual risks.

---

## 7. TOOLS AND TECHNOLOGIES

| Tool / Technology | Purpose |
|-------------------|---------|
| **React 18** | Frontend SPA framework |
| **React Router v6** | Client-side routing |
| **Axios** | HTTP client for API communication |
| **Python Flask 3** | Backend REST API |
| **SQLite** | Lightweight relational database |
| **bleach (Python)** | HTML sanitization library |
| **Python secrets** | Cryptographically secure token generation |
| **OWASP ZAP** | Vulnerability scanning and manual exploit testing |
| **Chrome** | Target browser for testing |

---

## 8. VULNERABILITIES EXPLAINED

### 8.1 Cross-Site Scripting (XSS)

**Definition**: XSS occurs when an attacker injects malicious scripts into web pages viewed by other users, exploiting insufficient output encoding.

**Types demonstrated**:

**Reflected XSS**:
- The application echoes back the `city` parameter from the search query directly into the response without encoding.
- Payload: `GET /api/rooms?city=<script>alert('XSS')</script>`
- The frontend renders this using `dangerouslySetInnerHTML`, causing script execution in the victim's browser.

**Stored XSS**:
- The booking form accepts `guest_name` and `special_request` fields.
- These are stored in the database without sanitization.
- When any user views the booking details, the raw stored HTML is rendered, triggering the payload.
- Similarly, the reviews section stores and renders raw HTML content.

**OWASP Classification**: A03:2021 – Injection

**Impact**: Session hijacking, credential theft, page defacement, malware distribution.

---

### 8.2 Insecure Direct Object Reference (IDOR)

**Definition**: IDOR is a form of broken access control where an application exposes internal implementation objects (like database IDs) to users and does not verify that the requesting user has permission to access the requested resource.

**How it appears in this project**:
- Booking records are retrieved via `GET /api/bookings/<id>` where `<id>` is a sequential integer (1, 2, 3...).
- No authentication or ownership check is performed.
- Any user who knows (or guesses) a booking ID can access, view, or cancel any other user's booking.

**Attack scenario**:
1. Attacker makes a booking and gets booking ID = 5.
2. Attacker manually changes URL to `/booking/1`, `/booking/2`, etc.
3. Views PII (name, email, dates) of other guests.
4. Calls `/api/bookings/3/cancel` to cancel a stranger's booking.

**OWASP Classification**: A01:2021 – Broken Access Control

**Impact**: Unauthorized data access, privacy breach, data manipulation.

---

### 8.3 Open Redirect (Unvalidated Redirect)

**Definition**: An open redirect vulnerability occurs when an application accepts user-controlled input to redirect the browser to an arbitrary URL without validating that the destination is safe.

**How it appears in this project**:
- The endpoint `GET /api/redirect?next=<URL>` performs a server-side redirect using the raw value of the `next` parameter.
- No validation is performed on the target URL.

**Attack scenario**:
1. Attacker crafts URL: `http://localhost:5000/api/redirect?next=https://phishing-site.com/fake-login`
2. Victim clicks the link (trusting the `localhost` domain).
3. Browser is redirected to the attacker's phishing site.
4. Victim enters credentials, believing they are on the hotel's site.

**OWASP Classification**: A10:2021 – Server-Side Request Forgery (adjacent); historically listed separately.

**Impact**: Phishing attacks, credential harvesting, malware delivery.

---

## 9. MITIGATION TECHNIQUES

### 9.1 XSS Mitigation

| Approach | Implementation |
|----------|---------------|
| **Input Sanitization** | `bleach.clean(input, tags=[], strip=True)` — strips all HTML tags server-side |
| **Output Encoding** | `html.escape()` applied to query echoes in API responses |
| **Framework-level encoding** | React JSX `{variable}` syntax auto-escapes HTML — avoid `dangerouslySetInnerHTML` |
| **Content-Security-Policy** | CSP header prevents inline script execution even if XSS payload is injected |
| **Input length limits** | `[:200]` truncation prevents large payload injection |

### 9.2 IDOR Mitigation

| Approach | Implementation |
|----------|---------------|
| **Owner Token** | Each booking is assigned a `secrets.token_urlsafe(32)` token at creation |
| **Token Verification** | All booking access endpoints check the `X-Owner-Token` request header against the stored token |
| **No exposure** | Token is never returned in GET responses (deleted from response dict) |
| **Client storage** | Token stored in `sessionStorage` keyed by booking ID; not accessible cross-origin |

### 9.3 Open Redirect Mitigation

| Approach | Implementation |
|----------|---------------|
| **Hostname Allowlist** | `ALLOWED_REDIRECT_HOSTS = {"localhost", "127.0.0.1"}` |
| **URL Parsing** | `urllib.parse.urlparse()` extracts hostname; compared against allowlist |
| **Relative-only fallback** | Only paths beginning with `/` are allowed; otherwise redirect to `/` |
| **HTTP 400 for violations** | Returns error response instead of performing the redirect |

### 9.4 Additional Security Headers

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: no-referrer
Content-Security-Policy: default-src 'self'; script-src 'self'
```

---

## 10. KEY TAKEAWAYS

1. **Never trust user input**: All data coming from the client must be validated, sanitized, and encoded before processing, storage, or display.

2. **Avoid direct object exposure**: Use non-guessable identifiers (UUIDs, tokens) and enforce ownership checks at the server side for every resource access.

3. **Validate redirects server-side**: Never use user-supplied URLs in redirect responses. Use allowlists of trusted destinations.

4. **Defense in depth**: Multiple overlapping controls (input sanitization + CSP + framework encoding) are more resilient than a single layer of protection.

5. **OWASP ZAP is effective for discovery**: Automated scanning detects many common vulnerability patterns, but manual testing remains essential for logic-based flaws like IDOR.

6. **Secure defaults matter**: Frameworks like React are secure by default (auto-escaping) — using escape hatches like `dangerouslySetInnerHTML` introduces risk and must be carefully justified and controlled.

7. **Fix verification is essential**: After applying mitigations, re-scanning with ZAP and repeating manual tests confirms that vulnerabilities are truly resolved.

---

## 11. CONCLUSION

This project successfully demonstrates the complete VAPT lifecycle on a hotel booking web application. Three OWASP Top 10 vulnerability classes — XSS, IDOR, and Open Redirect — were implemented in a controlled manner, identified using OWASP ZAP, and mitigated using industry-standard secure coding practices. The dual-mode structure (insecure vs. secure) provides a clear, side-by-side educational comparison valuable for both academic reporting and live demonstration.
