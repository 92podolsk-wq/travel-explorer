import { config } from "dotenv";
import path from "node:path";

config({ path: path.resolve(import.meta.dirname, ".env.test") });

if (!process.env.DATABASE_URL?.includes("travel_explorer_test")) {
  throw new Error(
    "Integration tests must run against a database named travel_explorer_test. " +
      "Refusing to run against DATABASE_URL=" +
      process.env.DATABASE_URL
  );
}
