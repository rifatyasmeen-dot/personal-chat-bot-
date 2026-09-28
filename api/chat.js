// Vercel Node.js serverless function — forwards the conversation to Claude via the
// official Anthropic SDK and returns the reply. ANTHROPIC_API_KEY is set on the
// Vercel dashboard, never hard-coded here. Also persists the conversation to Postgres
// (conversations/messages) so history survives a page refresh.
const Anthropic = require("@anthropic-ai/sdk");
const { pool } = require("../db/client");

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

  const { messages, conversation_id } = await parseBody(req);
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages must be a non-empty array" });
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: "Server misconfigured: ANTHROPIC_API_KEY not set." });
    return;
  }

  let conversationId = conversation_id;
  try {
    if (!conversationId) {
      const { rows } = await pool.query(
        "INSERT INTO conversations DEFAULT VALUES RETURNING id"
      );
      conversationId = rows[0].id;
    }
    const lastMessage = messages[messages.length - 1];
    await pool.query(
      "INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)",
      [conversationId, lastMessage.role, lastMessage.content]
    );
  } catch (err) {
    console.error("Failed to persist message:", err);
    // Don't block the chat reply on a database hiccup — persistence is best-effort.
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      messages,
    });
    const textBlock = response.content.find((block) => block.type === "text");
    const reply = textBlock ? textBlock.text : "";

    try {
      await pool.query(
        "INSERT INTO messages (conversation_id, role, content) VALUES ($1, 'assistant', $2)",
        [conversationId, reply]
      );
    } catch (err) {
      console.error("Failed to persist reply:", err);
    }

    res.status(200).json({ reply, conversation_id: conversationId });
  } catch (err) {
    console.error("Claude API request failed:", err);
    res.status(502).json({ error: "Claude API request failed. Please try again shortly.", conversation_id: conversationId });
  }
};
