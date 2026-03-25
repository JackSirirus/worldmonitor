/**
 * Data Migration Script
 * Migrates data from Redis to PostgreSQL
 */

import { createClient, RedisClientType } from 'redis';
import { query, transaction } from '../database/connection.js';

interface RedisNewsItem {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  source?: string;
  category?: string;
}

interface MigrationResult {
  migrated: number;
  duplicates: number;
  errors: number;
}

/**
 * Main migration function
 */
export async function migrateFromRedis(): Promise<MigrationResult> {
  console.log('[Migration] Starting Redis to PostgreSQL migration...');

  const result: MigrationResult = {
    migrated: 0,
    duplicates: 0,
    errors: 0,
  };

  try {
    // Connect to Redis
    const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
    if (!redisUrl) {
      throw new Error('REDIS_URL not configured');
    }

    const redis = createClient({ url: redisUrl });
    await redis.connect();

    // Get all news keys
    const keys = await redis.keys('news:*');

    console.log(`[Migration] Found ${keys.length} news items in Redis`);

    // Migrate in batches
    for (const key of keys) {
      try {
        const data = await redis.get(key);
        if (!data) continue;

        const item: RedisNewsItem = JSON.parse(data);

        // Check for duplicates
        const existing = await query<{ id: number }>(
          'SELECT id FROM rss_items WHERE link = $1',
          [item.link]
        );

        if (existing.rows.length > 0) {
          result.duplicates++;
          continue;
        }

        // Insert into PostgreSQL
        await query(
          `INSERT INTO rss_items (source_url, title, link, description, pub_date, category)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            item.source || 'unknown',
            item.title,
            item.link,
            item.description || null,
            item.pubDate ? new Date(item.pubDate) : null,
            item.category || null,
          ]
        );

        result.migrated++;

        // Delete from Redis after successful migration
        await redis.del(key);
      } catch (err) {
        console.error(`[Migration] Error migrating ${key}:`, err);
        result.errors++;
      }
    }

    // Cleanup: delete old Redis keys
    await redis.quit();

    console.log(`[Migration] Complete: ${result.migrated} migrated, ${result.duplicates} duplicates, ${result.errors} errors`);
  } catch (err) {
    console.error('[Migration] Migration failed:', err);
    throw err;
  }

  return result;
}

/**
 * Verify migration
 */
export async function verifyMigration(): Promise<{
  redisRemaining: number;
  postgresCount: number;
}> {
  // Check Redis
  let redisRemaining = 0;
  try {
    const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
    if (redisUrl) {
      const redis = createClient({ url: redisUrl });
      await redis.connect();
      const keys = await redis.keys('news:*');
      redisRemaining = keys.length;
      await redis.quit();
    }
  } catch {
    // Redis not available
  }

  // Check PostgreSQL
  const result = await query<{ count: string }>('SELECT COUNT(*) as count FROM rss_items');
  const postgresCount = parseInt(result.rows[0]?.count || '0', 10);

  return { redisRemaining, postgresCount };
}

/**
 * Export data from PostgreSQL to JSON
 */
export async function exportToJson(): Promise<void> {
  const result = await query<{
    id: number;
    source_url: string;
    title: string;
    link: string;
    description: string | null;
    pub_date: Date | null;
    category: string | null;
    fetched_at: Date;
  }>('SELECT * FROM rss_items ORDER BY fetched_at DESC LIMIT 10000');

  const fs = await import('fs');
  const filename = `worldmonitor-export-${new Date().toISOString().split('T')[0]}.json`;
  fs.writeFileSync(filename, JSON.stringify(result.rows, null, 2));

  console.log(`[Migration] Exported ${result.rows.length} items to ${filename}`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateFromRedis()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default { migrateFromRedis, verifyMigration, exportToJson };
