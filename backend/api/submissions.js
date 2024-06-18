const express = require('express');
const { connectDb } = require('./db');
const router = express.Router();

router.post('/new-submission', async (req, res, next) => {
  const { store, timestamp, ingredients } = req.body;
  const client = await connectDb();
  try {
    const compra = JSON.stringify(ingredients);

    const result = await client.query('INSERT INTO submissions (store, timestamp, compra) VALUES ($1, $2, $3) RETURNING *', [store, timestamp, compra]);

    await client.query(`
      WITH ranked_submissions AS (
        SELECT id, ROW_NUMBER() OVER(PARTITION BY DATE(timestamp) ORDER BY timestamp DESC) as rn
        FROM submissions
        WHERE store = $1 AND DATE(timestamp) = DATE($2)
      )
      DELETE FROM submissions
      WHERE id IN (SELECT id FROM ranked_submissions WHERE rn > 1)
    `, [store, timestamp]);

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  } finally {
    client.release();
  }
});

router.get('/all-submissions', async (req, res, next) => {
  const client = await connectDb();
  try {
    const result = await client.query('SELECT * FROM submissions');
    res.json(result.rows);
  } catch (err) {
    next(err);
  } finally {
    client.release();
  }
});

module.exports = router;
