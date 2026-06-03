const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const hash = bcrypt.hashSync('Admin1234!', 12);
console.log('Generated hash:', hash);

const pool = new Pool({
  host: 'db',
  port: 5432,
  database: 'scdk_platform',
  user: 'scdk_user',
  password: process.env.DB_PASSWORD
});

pool.query('UPDATE users SET password_hash = $1', [hash])
  .then(r => {
    console.log('Updated:', r.rowCount, 'users');
    pool.end();
  })
  .catch(err => {
    console.error('Error:', err.message);
    pool.end();
  });