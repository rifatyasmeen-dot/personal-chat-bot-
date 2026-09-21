// Vercel Node.js serverless function — checks submitted credentials against
// BOT_USERNAME / BOT_PASSWORD (set on the Vercel dashboard, never hard-coded here),
// and on success sets the signed cookie that middleware.js checks on every other route.
const crypto = require("crypto");

function parseBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try {
        if ((req.headers["content-type"] || "").includes("application/json")) {
          resolve(JSON.parse(data || "{}"));
        } else {
          resolve(Object.fromEntries(new URLSearchParams(data)));
        }
      } catch {
        resolve({});
      }
    });
  });
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method not allowed");
    return;
  }

  const { username, password } = await parseBody(req);
  const expectedUser = process.env.BOT_USERNAME;
  const expectedPass = process.env.BOT_PASSWORD;

  if (!expectedUser || !expectedPass) {
    res.status(500).send("Server misconfigured: BOT_USERNAME/BOT_PASSWORD not set.");
    return;
  }

  if (username === expectedUser && password === expectedPass) {
    const token = crypto
      .createHmac("sha256", expectedPass)
      .update("authenticated")
      .digest("hex");
    res.setHeader(
      "Set-Cookie",
      `bot_auth=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 12}`
    );
    res.writeHead(302, { Location: "/" });
    res.end();
    return;
  }

  res.writeHead(302, { Location: "/login.html?error=1" });
  res.end();
};
