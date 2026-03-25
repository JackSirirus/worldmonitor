import { query } from './database/connection.js';
import fs from 'fs';

async function initSchema() {
  try {
    const sql = fs.readFileSync('./database/schema.sql', 'utf-8');
    await query(sql);
    console.log('Schema initialized successfully');
  } catch (e) {
    console.error('Schema error:', e.message);
  }
}

initSchema();
