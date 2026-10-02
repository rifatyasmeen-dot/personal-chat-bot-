# Quality rubric — error messages shown to the user

Applies to any error bubble rendered in the chat UI (login failures, API failures, server
misconfiguration, validation failures). Each line is a yes/no test.

1. Says what went wrong.
2. Says what to do next (retry, wait, sign in again, etc.).
3. No jargon — no raw error codes, stack traces, JSON, or HTTP status numbers.
4. Doesn't blame the user.
5. Under fifteen words.

A message passes the rubric only if all five are "yes".
