# Judge results — personal-bot error messages

Scored against `quality-rubric.md` (5 yes/no lines). Verdict is PASS only if all 5 are "yes".
Source noted as (real) — pulled verbatim from the codebase — or (synthetic) — a plausible
variant written to give the rubric real signal to work with.

| # | Message | Verdict | Reason |
|---|---|---|---|
| 1 | "Method not allowed" (real) | FAIL | A raw HTTP status phrase that doesn't explain what happened or what to do. |
| 2 | "messages must be a non-empty array" (real) | FAIL | Exposes internal implementation detail ("array") instead of plain language. |
| 3 | "Server misconfigured: ANTHROPIC_API_KEY not set." (real) | FAIL | Correctly admits a config problem but names an env var, which is jargon for an end user. |
| 4 | "Claude API request failed. Please try again shortly." (real) | **PASS** ⚠ least sure | Clear, actionable, blame-free; "API" is mild jargon but widely understood today. |
| 5 | "Could not load history." (real) | FAIL | States the problem clearly but gives no next step. |
| 6 | "Server misconfigured: BOT_USERNAME/BOT_PASSWORD not set." (real) | FAIL | Same config-jargon issue as #3 — exposes env var names. |
| 7 | "Wrong username or password." (real) | FAIL ⚠ least sure | Says what's wrong but never explicitly tells the user to retry, even though it's implied. |
| 8 | `Error: 400 {"type":"error",...,"request_id":"req_011..."}` (real, pre-fix) | FAIL | A raw API error dump with an internal request_id — exactly the leak this rubric exists to catch. |
| 9 | "Something went wrong. Try again." (synthetic) | FAIL | Tells the user to retry but never says what actually failed. |
| 10 | "You entered the wrong thing." (synthetic) | FAIL | Directly blames the user instead of describing the actual problem. |
| 11 | "ERR_CONN_TIMEOUT_5021: upstream socket hangup during TLS handshake." (synthetic) | FAIL | Entirely composed of network/TLS jargon no ordinary user could parse. |
| 12 | "We couldn't reach Claude right now — please wait a moment and try again." (synthetic) | PASS | Plain language, explains the problem, and gives a clear, blame-free next step. |
| 13 | "Your session has expired. Please sign in again." (synthetic) | PASS | Clear cause and clear fix, with no jargon or blame. |
| 14 | "An unexpected error occurred. Error code: 0x8007042B. Contact your admin." (synthetic) | FAIL | Hides behind a meaningless hex code instead of explaining the problem in plain terms. |
| 15 | "You forgot to type a message." (synthetic) | FAIL | Blames the user ("you forgot") for something the UI should just prevent. |
| 16 | "The database connection could not be established. Check your DATABASE_URL and network settings." (synthetic) | FAIL ⚠ least sure | Gives a real next step but names an internal env var, which end users won't recognize. |
| 17 | "Request failed. Please try again in a few seconds." (synthetic) | PASS | Short, plain, actionable, and doesn't point fingers. |
| 18 | "500 Internal Server Error" (synthetic) | FAIL | A bare HTTP status code with no plain-language explanation or next step. |
| 19 | "Rate limit exceeded. Please slow down and try again shortly." (synthetic) | PASS ⚠ least sure | Explains the cause and gives a next step; "rate limit" and "slow down" are borderline jargon/tone but widely understood. |
| 20 | "Invalid request body: expected 'messages' array but received undefined." (synthetic) | FAIL | Pure developer/debug language ("request body", "array", "undefined") — unsuitable for an end user. |

**Summary:** 5 / 20 passed (#4, 12, 13, 17, 19). 4 flagged least-sure (#4, 7, 16, 19) — these are the
ones worth hand-checking first.
