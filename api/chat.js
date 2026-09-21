// Vercel Node.js serverless function — forwards the conversation to Claude via the
// official Anthropic SDK and returns the reply. ANTHROPIC_API_KEY is set on the
// Vercel dashboard, never hard-coded here.
const Anthropic = require("@anthropic-ai/sdk");

function parseBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(data || "{}"));
      } catch {
        resolve({});
      }
    });
  });
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { messages } = await parseBody(req);
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages must be a non-empty array" });
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: "Server misconfigured: ANTHROPIC_API_KEY not set." });
    return;
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      messages,
    });
    const textBlock = response.content.find((block) => block.type === "text");
    res.status(200).json({ reply: textBlock ? textBlock.text : "" });
  } catch (err) {
    console.error("Claude API request failed:", err);
    res.status(502).json({ error: "Claude API request failed. Please try again shortly." });
  }
};
