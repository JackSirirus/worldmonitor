import { query } from './connection.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Initialize database schema
 */
export async function initializeSchema(): Promise<void> {
  const schemaPath = join(__dirname, 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');

  console.log('[Database] Initializing schema...');

  try {
    // Split by semicolon and execute each statement
    // Filter out empty statements and comments
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let executed = 0;
    for (const statement of statements) {
      try {
        await query(statement);
        executed++;
      } catch (err) {
        // Ignore duplicate object errors (already exists)
        const error = err as Error & { code?: string };
        if (error.code !== '42P07' && error.code !== '42710') { // duplicate_table, duplicate_object
          console.error('[Schema] Statement error:', error.message);
        }
      }
    }

    console.log(`[Database] Schema initialized (${executed} statements executed)`);
  } catch (error) {
    console.error('[Database] Schema initialization failed:', error);
    throw error;
  }
}

/**
 * Check if tables exist
 */
export async function tablesExist(): Promise<boolean> {
  try {
    const result = await query<{ count: number }>(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public'"
    );
    return result.rows[0]?.count > 0;
  } catch {
    return false;
  }
}

export default {
  initializeSchema,
  tablesExist,
};
