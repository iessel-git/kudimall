const { Pool } = require('pg');

// Support both DATABASE_URL (production) and individual config (development)
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
  : new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'kudimall_dev',
      password: process.env.DB_PASSWORD || '@Memba3nyinaa2$',
      port: parseInt(process.env.DB_PORT || '5432'),
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