import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL ?? 'postgres://yusufsiregar@localhost:5432/alpheya_local';

console.log('Database connection string:', connectionString.replace(/\/\/.*@/, '//***@')); // Log without password

const pool = new pg.Pool({ 
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test the connection
pool.on('connect', () => {
  console.log('Database connected successfully');
});

pool.on('error', (err: Error) => {
  console.error('Database connection error:', err);
});

export const db = drizzle(pool);


