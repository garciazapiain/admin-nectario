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

    // Only proceed if selectedInventarioOption is true
    if (selectedInventarioOption) {
      const summarizedInventario = ingredients.map(ingrediente => ({
        id_ingrediente: ingrediente.id_ingrediente,
        cantidad: parseFloat(ingrediente.cantidad_inventario).toFixed(2)  // Ensure proper numeric format
      }));
      const inventarioJson = JSON.stringify(summarizedInventario);

      // Calculate timestamp for final inventory as one day earlier
      const finalTimestamp = new Date(new Date(timestamp).getTime() - (24 * 60 * 60 * 1000)).toISOString();

      // Delete and insert final inventory with the adjusted timestamp
      await client.query('DELETE FROM submission_inventario WHERE store = $1 AND DATE(timestamp) = DATE($2) AND tipo_inventario = $3', [store, finalTimestamp, 'final']);
      await client.query('INSERT INTO submission_inventario (tipo_inventario, timestamp, inventario, store) VALUES ($1, $2, $3, $4)', ['final', finalTimestamp, inventarioJson, store]);

      // Delete and insert initial inventory for the next period
      await client.query('DELETE FROM submission_inventario WHERE store = $1 AND DATE(timestamp) = DATE($2) AND tipo_inventario = $3', [store, timestamp, 'inicial']);
      await client.query('INSERT INTO submission_inventario (tipo_inventario, timestamp, inventario, store) VALUES ($1, $2, $3, $4)', ['inicial', timestamp, inventarioJson, store]);

      // Update entradas_salidas for each ingredient
      for (const ingrediente of ingredients) {
        const cantidadInventario = parseFloat(ingrediente.cantidad_inventario).toFixed(2);
        const numericCantidadInventario = Number(cantidadInventario);  // Ensure it's numeric

        // Only proceed if the ingredient is set to track inventory
        const checkTrackearInventario = await client.query('SELECT 1 FROM ingredientes WHERE id_ingrediente = $1 AND trackear_inventario = true', [ingrediente.id_ingrediente]);

        if (checkTrackearInventario.rows.length > 0) {
          const startOfWeek = new Date(timestamp);
          const endOfWeek = new Date(timestamp);
          startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);  // Monday of the current week
          endOfWeek.setDate(startOfWeek.getDate() + 6);  // Sunday of the current week

          // Check if a record for this id_ingrediente and fecha_inicio exists
          const existingEntry = await client.query(
            `SELECT inventario_inicial_cedis, inventario_inicial_moral, inventario_inicial_bosques, 
                    is_inventario_submitted_cedis, is_inventario_submitted_moral, is_inventario_submitted_bosques 
             FROM entradas_salidas 
             WHERE id_ingrediente = $1 AND fecha_inicio = $2`,
            [ingrediente.id_ingrediente, startOfWeek.toISOString().split('T')[0]]
          );

          if (existingEntry.rows.length === 0) {
            // Insert a new record with the correct store's initial inventory
            await client.query(
              `INSERT INTO entradas_salidas 
               (id_ingrediente, fecha_inicio, fecha_fin, total_quantity, quantity_cedis, quantity_moral, quantity_campestre, 
                inventario_inicial_cedis, inventario_inicial_moral, inventario_inicial_bosques, 
                is_inventario_submitted_cedis, is_inventario_submitted_moral, is_inventario_submitted_bosques)
               VALUES 
               ($1, $2, $3, 0.0, 0.0, 0.0, 0.0, 
                CASE WHEN $5 = 'cedis' THEN $4 ELSE 0.0 END, 
                CASE WHEN $5 = 'moral' THEN $4 ELSE 0.0 END, 
                CASE WHEN $5 = 'bosques' THEN $4 ELSE 0.0 END, 
                CASE WHEN $5 = 'cedis' THEN TRUE ELSE FALSE END, 
                CASE WHEN $5 = 'moral' THEN TRUE ELSE FALSE END, 
                CASE WHEN $5 = 'bosques' THEN TRUE ELSE FALSE END
               )`,
              [ingrediente.id_ingrediente, startOfWeek.toISOString().split('T')[0], endOfWeek.toISOString().split('T')[0], numericCantidadInventario, store]
            );
          } else {
            // Check and update the correct store's inventory
            const { is_inventario_submitted_cedis, is_inventario_submitted_moral, is_inventario_submitted_bosques } = existingEntry.rows[0];
            let shouldUpdate = false;

            if (store === 'cedis' && !is_inventario_submitted_cedis) {
              shouldUpdate = true;
              await client.query(
                `UPDATE entradas_salidas 
                 SET inventario_inicial_cedis = inventario_inicial_cedis + $1, is_inventario_submitted_cedis = TRUE
                 WHERE id_ingrediente = $2 AND fecha_inicio = $3`,
                [numericCantidadInventario, ingrediente.id_ingrediente, startOfWeek.toISOString().split('T')[0]]
              );
            } else if (store === 'moral' && !is_inventario_submitted_moral) {
              shouldUpdate = true;
              await client.query(
                `UPDATE entradas_salidas 
                 SET inventario_inicial_moral = inventario_inicial_moral + $1, is_inventario_submitted_moral = TRUE
                 WHERE id_ingrediente = $2 AND fecha_inicio = $3`,
                [numericCantidadInventario, ingrediente.id_ingrediente, startOfWeek.toISOString().split('T')[0]]
              );
            } else if (store === 'bosques' && !is_inventario_submitted_bosques) {
              shouldUpdate = true;
              await client.query(
                `UPDATE entradas_salidas 
                 SET inventario_inicial_bosques = inventario_inicial_bosques + $1, is_inventario_submitted_bosques = TRUE
                 WHERE id_ingrediente = $2 AND fecha_inicio = $3`,
                [numericCantidadInventario, ingrediente.id_ingrediente, startOfWeek.toISOString().split('T')[0]]
              );
            }
            if (!shouldUpdate) {
              console.log(`Inventario already submitted for ${store}. Skipping update.`);
            }
          }
        }
      }
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

router.get('/latest-submissions', async (req, res, next) => {
  const client = await connectDb();
  try {
    const result = await client.query(`
      WITH ranked_submissions AS (
        SELECT
          id,
          store,
          timestamp::timestamp AS timestamp_casted,
          compra,
          ROW_NUMBER() OVER (PARTITION BY store ORDER BY timestamp::timestamp DESC) AS rank
        FROM
          submissions
        WHERE
          store IN ('moral', 'bosques')
      )
      SELECT
        id,
        store,
        timestamp_casted AS timestamp,
        compra
      FROM
        ranked_submissions
      WHERE
        rank = 1;
    `);
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
