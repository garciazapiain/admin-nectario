const express = require('express');
const { connectDb } = require('./db');
const router = express.Router();

router.post('/new-submission', async (req, res, next) => {
  const { store, timestamp, ingredients, selectedInventarioOption } = req.body;
  const client = await connectDb();
  try {
    const compra = JSON.stringify(ingredients);

    // Insert the submission into the submissions table
    const result = await client.query(
      'INSERT INTO submissions (store, timestamp, compra) VALUES ($1, $2, $3) RETURNING *',
      [store, timestamp, compra]
    );

    // Clean up old submissions to keep only the latest for the same store and day
    await client.query(`
      WITH ranked_submissions AS (
        SELECT id, ROW_NUMBER() OVER(PARTITION BY DATE(timestamp) ORDER BY timestamp DESC) as rn
        FROM submissions
        WHERE store = $1 AND DATE(timestamp) = DATE($2)
      )
      DELETE FROM submissions
      WHERE id IN (SELECT id FROM ranked_submissions WHERE rn > 1)
    `, [store, timestamp]);

    // If selectedInventarioOption is true, handle both initial and final inventory
    if (selectedInventarioOption) {
      const summarizedInventario = ingredients.map(ingrediente => ({
        id_ingrediente: ingrediente.id_ingrediente,
        cantidad: ingrediente.cantidad_inventario
      }));
      const inventarioJson = JSON.stringify(summarizedInventario);

      // Calculate timestamp for final inventory as one day earlier
      const finalTimestamp = new Date(new Date(timestamp).getTime() - (24 * 60 * 60 * 1000)).toISOString();

      // Insert final inventory with the adjusted timestamp
      await client.query(
        'INSERT INTO submission_inventario (tipo_inventario, timestamp, inventario, store) VALUES ($1, $2, $3, $4)',
        ['final', finalTimestamp, inventarioJson, store]
      );

      // Insert initial inventory for the next period with the original timestamp
      await client.query(
        'INSERT INTO submission_inventario (tipo_inventario, timestamp, inventario, store) VALUES ($1, $2, $3, $4)',
        ['inicial', timestamp, inventarioJson, store]
      );
    }

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

router.get('/inventario-submissions', async (req, res, next) => {
  const client = await connectDb();
  try {
    const result = await client.query('SELECT * FROM submission_inventario');
    res.json(result.rows);
  } catch (err) {
    next(err);
  } finally {
    client.release();
  }
});

module.exports = router;
