/**
 * Backup Service
 * Handles database backups to local storage and cloud
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, readdir, stat, readFile } from 'fs/promises';
import { join } from 'path';
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { logger } from '../utils/logger.js';

const execAsync = promisify(exec);

const BACKUP_DIR = process.env.BACKUP_DIR || '/backups';
const LOCAL_RETENTION_DAYS = 30;
const CLOUD_RETENTION_DAYS = 365;
const MAX_RETRIES = 3;

/**
 * Run backup task
 */
export async function runBackup(): Promise<void> {
  logger.info('[Backup] Starting backup task');

  try {
    // Create local backup
    const localPath = await createLocalBackup();

    // Upload to cloud if configured
    if (isCloudConfigured()) {
      await uploadToCloud(localPath);
    }

    // Cleanup old local backups
    await cleanupLocalBackups();

    // Cleanup old cloud backups
    if (isCloudConfigured()) {
      await cleanupCloudBackups();
    }

    logger.info('[Backup] Backup completed successfully');
  } catch (error) {
    logger.error({ err: error }, '[Backup] Backup failed');
    throw error;
  }
}

/**
 * Create local database backup
 */
async function createLocalBackup(): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `worldmonitor-${timestamp}.sql`;
  const filepath = join(BACKUP_DIR, filename);

  const dbUrl = process.env.DATABASE_URL || '';
  const match = dbUrl.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);

  if (!match) {
    throw new Error('Invalid DATABASE_URL format');
  }

  const [, user, password, host, port, database] = match;

  const cmd = `PGPASSWORD=${password} pg_dump -h ${host} -p ${port} -U ${user} -d ${database} -f ${filepath}`;

  logger.info({ filepath }, '[Backup] Creating local backup');
  await execAsync(cmd);

  // Verify file
  const fileStat = await stat(filepath);
  if (fileStat.size === 0) {
    throw new Error('Backup file is empty');
  }

  logger.info({ size: fileStat.size }, '[Backup] Local backup created');
  return filepath;
}

/**
 * Check if cloud storage is configured
 */
function isCloudConfigured(): boolean {
  return !!(process.env.R2_BUCKET || process.env.S3_BUCKET);
}

/**
 * Upload backup to cloud storage
 */
async function uploadToCloud(localPath: string): Promise<void> {
  const filename = localPath.split('/').pop();

  // Try R2 first, then S3
  if (process.env.R2_BUCKET && process.env.R2_ENDPOINT) {
    await uploadToR2(localPath, filename!);
  } else if (process.env.S3_BUCKET) {
    await uploadToS3(localPath, filename!);
  }
}

/**
 * Upload to Cloudflare R2
 */
async function uploadToR2(localPath: string, filename: string): Promise<void> {
  const s3Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY || '',
      secretAccessKey: process.env.R2_SECRET_KEY || '',
    },
  });

  const fileContent = await readFile(localPath);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: `backups/${filename}`,
      Body: fileContent,
    })
  );

  logger.info({ filename, bucket: process.env.R2_BUCKET }, '[Backup] Uploaded to R2');
}

/**
 * Upload to AWS S3
 */
async function uploadToS3(localPath: string, filename: string): Promise<void> {
  const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });

  const fileContent = await readFile(localPath);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: `worldmonitor/backups/${filename}`,
      Body: fileContent,
    })
  );

  logger.info({ filename, bucket: process.env.S3_BUCKET }, '[Backup] Uploaded to S3');
}

/**
 * Cleanup old local backups
 */
async function cleanupLocalBackups(): Promise<void> {
  const files = await readdir(BACKUP_DIR);
  const cutoff = Date.now() - LOCAL_RETENTION_DAYS * 24 * 60 * 60 * 1000;

  let deleted = 0;
  for (const file of files) {
    if (!file.startsWith('worldmonitor-') || !file.endsWith('.sql')) continue;

    const filepath = join(BACKUP_DIR, file);
    const fileStat = await stat(filepath);

    if (fileStat.mtimeMs < cutoff) {
      await unlink(filepath);
      deleted++;
    }
  }

  logger.info({ deleted }, '[Backup] Local backups cleaned up');
}

/**
 * Cleanup old cloud backups
 */
async function cleanupCloudBackups(): Promise<void> {
  // Implementation would use S3 list and delete objects older than retention period
  logger.info('[Backup] Cloud cleanup skipped (not implemented)');
}

export default { runBackup };
