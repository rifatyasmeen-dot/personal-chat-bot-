// Vercel Edge Middleware — gates every request behind a signed "bot_auth" cookie.
// The cookie value is HMAC-SHA256("authenticated") keyed by BOT_PASSWORD, so it can be
// verified here without a session database, and it changes automatically if the password
// changes on the Vercel dashboard.
export const config = {
  matcher: ["/((?!api/login|login\\.html|favicon\\.ico).*)"],
};

function bufToHex(buf) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function expectedToken(secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode("authenticated"));
  return bufToHex(sig);
}

function getCookie(request, name) {
  const header = request.headers.get("cookie") || "";
  const match = header
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(name + "="));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

export default async function middleware(request) {
  const secret = process.env.BOT_PASSWORD;
  if (!secret) {
    return new Response("Server misconfigured: BOT_PASSWORD is not set.", { status: 500 });
  }

  const cookie = getCookie(request, "bot_auth");
  const expected = await expectedToken(secret);
  if (cookie === expected) {
    return; // authenticated — let the request through
  }

  return Response.redirect(new URL("/login.html", request.url), 302);
}
