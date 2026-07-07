import "dotenv/config";
import fs from "fs";
import { Client } from "pg";

async function main() {
  const migrationPath = process.argv[2];
  if (!migrationPath) {
    throw new Error("Usage: tsx scripts/apply-migration.ts <path-to-migration.sql>");
  }

  const sql = fs.readFileSync(migrationPath, "utf-8");
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  try {
    await client.query(sql);
    console.log("Migration applied successfully.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
