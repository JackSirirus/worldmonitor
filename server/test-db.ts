import { query } from './database/connection.js';

async function test() {
  try {
    const result = await query('SELECT 1 as test');
    console.log('DB OK:', result.rows);
  } catch (e) {
    console.error('DB Error:', e.message);
  }
}

test();
