const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'scdk_platform',
  user:     process.env.DB_USER     || 'scdk_user',
  password: process.env.DB_PASSWORD || '',
  max:      20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected DB pool error:', err.message);
});

/**
 * Execute a parameterised query.
 * @param {string} text   SQL with $1, $2 placeholders
 * @param {Array}  params Parameter values
 */
const query = (text, params) => pool.query(text, params);

/**
 * Get a client from the pool (use for transactions).
 */
const getClient = () => pool.connect();

module.exports = { query, getClient, pool };
