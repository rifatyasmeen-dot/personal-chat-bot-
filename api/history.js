// Vercel Node.js serverless function — returns the message history for a conversation,
// so the chat UI can restore it after a page refresh.
const { pool } = require("../db/client");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { searchParams } = new URL(req.url, "http://localhost");
  const conversationId = searchParams.get("conversation_id");
  if (!conversationId) {
    res.status(200).json({ messages: [] });
    return;
  }

  try {
    const { rows } = await pool.query(
      "SELECT role, content FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC",
      [conversationId]
    );
    res.status(200).json({ messages: rows });
  } catch (err) {
    console.error("Failed to load history:", err);
    res.status(500).json({ error: "Could not load history." });
  }
};
