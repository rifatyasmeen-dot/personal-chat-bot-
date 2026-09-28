You are running headless (`claude -p`) as a scheduled synthetic-monitor check for the
personal-bot chat app. Do ONLY the steps below — no other analysis, no file edits, no
commentary beyond the final PASS/FAIL line.

1. Use the Chrome DevTools MCP tools to navigate to `https://personal-bot-teal.vercel.app/`.
   Confirm it redirects to `/login.html`. If it does not redirect, this is a FAIL.

2. Read `BOT_USERNAME` and `BOT_PASSWORD` from `.env` in the current directory
   (do not print their values anywhere in your output).

3. Fill in and submit the login form with those credentials. Confirm you land on the chat page
   (URL becomes `/`, page title is "Personal Bot") — not still on `/login.html` or an error page.

4. Confirm `list_console_messages` returns no `error`-type entries on the chat page itself
   (before sending any message).

5. Type a short test message (e.g. "synthetic monitor check") into the chat input and submit it.
   Wait for either a reply bubble or an error bubble to appear, then read its text.
   - If a normal assistant reply appears: full PASS, everything is healthy end to end.
   - If an error bubble appears reading exactly `Claude API request failed. Please try again
     shortly.`: this is a KNOWN, already-reported issue (the Anthropic account currently has no
     credit balance) — log it in your final summary but treat it as EXPECTED, not a failure.
     Do not alert for this specific message.
   - If an error bubble appears with ANY OTHER text — especially if it contains `request_id`,
     raw JSON (`{"type":"error"`), or any text other than the exact known message above — this
     is a REGRESSION of a previously-fixed bug (raw upstream errors used to leak to the user)
     and IS a FAIL that must alert.

If step 1, 2, 3, or 4 fail, or step 5 produces the "other error" case, call your
push-notification tool with a message under 200 characters naming exactly which step failed and
why. Do this immediately, don't wait until the end.

If step 5 is either a full pass or the known credit-balance message, and everything else passed,
do NOT call the notification tool. Stay completely silent for both of those outcomes.

End your final response with exactly one line, nothing after it:
`PASS - <one-line summary>` or `FAIL - <one-line summary of what broke>`
(the known credit-balance case counts as PASS for this line, since it is not a new problem)
