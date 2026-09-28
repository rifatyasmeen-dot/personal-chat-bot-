// npm run db:check — connects, lists tables, inserts one real conversation + linked
// message, reads them back with a join, and prints the result.
const { pool } = require("./client");

async function listTables() {
  const { rows } = await pool.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' ORDER BY table_name
  `);
  console.log("Tables:");
  for (const row of rows) {
    console.log(`  - ${row.table_name}`);
  }
  console.log();
}

async function insertAndJoin() {
  const convResult = await pool.query(
    "INSERT INTO conversations DEFAULT VALUES RETURNING id, started_at"
  );
  const conversation = convResult.rows[0];

  const msgResult = await pool.query(
    "INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3) RETURNING id",
    [conversation.id, "user", "db:check test message"]
  );

  const joined = await pool.query(
    `SELECT m.id AS message_id, m.role, m.content, m.created_at, c.id AS conversation_id, c.started_at
     FROM messages m JOIN conversations c ON c.id = m.conversation_id
     WHERE m.id = $1`,
    [msgResult.rows[0].id]
  );

  console.log("Inserted + joined row:");
  console.log(joined.rows[0]);
}

async function main() {
  console.log("Connected to:", process.env.DATABASE_URL.replace(/:[^:@]+@/, ":****@"));
  console.log();
  await listTables();
  await insertAndJoin();
  await pool.end();
}

main().catch((err) => {
  console.error("db:check FAILED:", err.message);
  process.exit(1);
});
