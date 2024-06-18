const { Pool } = require('pg');
const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: isProduction ? process.env.DATABASE_URL : 'postgresql://juangarciazapiain:123@localhost:5432/inventarios',
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

const connectDb = async () => {
  const client = await pool.connect();
  return client;
};

module.exports = {
  connectDb,
};
