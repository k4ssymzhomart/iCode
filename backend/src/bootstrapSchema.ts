import "dotenv/config";
import { readFile } from "node:fs/promises";
import { Client } from "pg";
import { supabaseAdmin } from "./supabaseClient";

const requiredTables = [
  "profiles",
  "tasks",
  "task_sets",
  "task_set_tasks",
  "classrooms",
  "lab_sessions",
  "session_students",
  "session_tasks",
  "student_metrics",
  "code_files",
  "help_requests",
  "editor_interventions",
  "feedback",
] as const;

const schemaPath = new URL("./schema.sql", import.meta.url);

let schemaReadyPromise: Promise<void> | null = null;

const tableExists = async (client: Client, tableName: string) => {
  const result = await client.query<{ regclass: string | null }>(
    "select to_regclass($1) as regclass",
    [`public.${tableName}`],
  );

  return result.rows[0]?.regclass !== null;
};

const tableExistsViaRest = async (tableName: (typeof requiredTables)[number]) => {
  const { error } = await supabaseAdmin.from(tableName).select("*").limit(1);
  return !error;
};

const getMissingTablesViaRest = async () => {
  const results = await Promise.all(
    requiredTables.map(async (tableName) => ({
      tableName,
      exists: await tableExistsViaRest(tableName),
    })),
  );

  return results.filter((result) => !result.exists).map((result) => result.tableName);
};

export const ensureBackendSchema = async () => {
  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      const missingTables = await getMissingTablesViaRest().catch(() => requiredTables as readonly string[]);

      if (missingTables.length === 0) {
        console.log("Backend schema already available through Supabase REST.");
        return;
      }

      const connectionString = process.env.SUPABASE_DB_URL;

      if (!connectionString) {
        console.warn(
          `SUPABASE_DB_URL is missing. Skipping backend schema bootstrap. Missing tables: ${missingTables.join(", ")}`,
        );
        return;
      }

      if (connectionString.includes("[YOUR-PASSWORD]")) {
        console.warn(
          `SUPABASE_DB_URL still contains the placeholder password. Skipping backend schema bootstrap. Missing tables: ${missingTables.join(", ")}`,
        );
        return;
      }

      const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
      });

      try {
        await client.connect();

        const schemaSql = await readFile(schemaPath, "utf8");
        await client.query(schemaSql);

        try {
          await client.query("NOTIFY pgrst, 'reload schema'");
        } catch (error) {
          console.warn("Applied schema, but failed to request PostgREST reload.", error);
        }

        for (const tableName of requiredTables) {
          if (!(await tableExists(client, tableName))) {
            throw new Error(`Schema bootstrap did not create required table "${tableName}".`);
          }
        }

        console.log("Applied backend classroom schema.");
      } finally {
        await client.end().catch(() => undefined);
      }
    })().catch((error) => {
      schemaReadyPromise = null;
      throw error;
    });
  }

  try {
    await schemaReadyPromise;
  } catch (error) {
    console.warn(
      "Backend schema bootstrap was skipped because the database connection could not be established.",
      error,
    );
  }
};
