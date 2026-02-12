const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',           // your PostgreSQL username
  host: 'localhost',          // your PostgreSQL host
  database: 'kudimall_dev',   // your PostgreSQL database name
  password: '@Memba3nyinaa2$',               // your PostgreSQL password
  port: 5432,                 // default PostgreSQL port
});

class Database {
  async run(sql, params = []) {
    const result = await pool.query(sql, params);
    return { rowCount: result.rowCount, rows: result.rows };
  }

  async get(sql, params = []) {
    const result = await pool.query(sql, params);
    return result.rows[0] || null;
  }

  async all(sql, params = []) {
    const result = await pool.query(sql, params);
    return result.rows;
  }

  async close() {
    await pool.end();
  }
}

module.exports = new Database();