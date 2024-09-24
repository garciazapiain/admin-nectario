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

      // Delete existing final inventory record for that date
      await client.query(
        'DELETE FROM submission_inventario WHERE store = $1 AND DATE(timestamp) = DATE($2) AND tipo_inventario = $3',
        [store, finalTimestamp, 'final']
      );

      // Insert final inventory with the adjusted timestamp
      await client.query(
        'INSERT INTO submission_inventario (tipo_inventario, timestamp, inventario, store) VALUES ($1, $2, $3, $4)',
        ['final', finalTimestamp, inventarioJson, store]
      );

      // Delete existing initial inventory record for that date
      await client.query(
        'DELETE FROM submission_inventario WHERE store = $1 AND DATE(timestamp) = DATE($2) AND tipo_inventario = $3',
        [store, timestamp, 'inicial']
      );

      // Insert initial inventory for the next period with the original timestamp
      await client.query(
        'INSERT INTO submission_inventario (tipo_inventario, timestamp, inventario, store) VALUES ($1, $2, $3, $4)',
        ['inicial', timestamp, inventarioJson, store]
      );

      // **Update entradas_salidas for each ingredient**
      for (const ingrediente of ingredients) {
        // **Check if the ingredient is marked as producto_clave**
        const checkClave = await client.query(
          'SELECT 1 FROM ingredientes WHERE id_ingrediente = $1 AND producto_clave = true',
          [ingrediente.id_ingrediente]
        );

        if (checkClave.rows.length > 0) {
          // Calculate the week range for the timestamp
          const startOfWeek = new Date(timestamp);
          const endOfWeek = new Date(timestamp);
          startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Monday of the current week
          endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday of the current week

          // **Check if a record for this id_ingrediente and fecha_inicio exists**
          const existingEntry = await client.query(
            `SELECT inventario_inicial, inventario_submitted_cedis, inventario_submitted_moral, inventario_submitted_bosques 
             FROM entradas_salidas 
             WHERE id_ingrediente = $1 AND fecha_inicio = $2`,
            [ingrediente.id_ingrediente, startOfWeek.toISOString().split('T')[0]]
          );

          if (existingEntry.rows.length === 0) {
            // **Insert a new record with default quantities (0 for all)**
            await client.query(
              `INSERT INTO entradas_salidas (id_ingrediente, fecha_inicio, fecha_fin, total_quantity, quantity_cedis, quantity_moral, quantity_campestre, inventario_inicial, inventario_submitted_cedis, inventario_submitted_moral, inventario_submitted_bosques)
              VALUES ($1, $2, $3, 0, 0, 0, 0, $4, FALSE, FALSE, FALSE)`,
              [
                ingrediente.id_ingrediente,
                startOfWeek.toISOString().split('T')[0],
                endOfWeek.toISOString().split('T')[0],
                ingrediente.cantidad_inventario // inventario_inicial
              ]
            );
          } else {
            // **Check which store is being submitted to and if it hasn't already been submitted**
            const { inventario_submitted_cedis, inventario_submitted_moral, inventario_submitted_bosques } = existingEntry.rows[0];
            let shouldUpdate = false;
            console.log(store)

            if (store === 'cedis' && !inventario_submitted_cedis) {
              shouldUpdate = true;
              await client.query(
                `UPDATE entradas_salidas 
                 SET inventario_inicial = inventario_inicial + $1, inventario_submitted_cedis = TRUE
                 WHERE id_ingrediente = $2 AND fecha_inicio = $3`,
                [
                  ingrediente.cantidad_inventario,  // New value to add to inventario_inicial
                  ingrediente.id_ingrediente,
                  startOfWeek.toISOString().split('T')[0]  // fecha_inicio
                ]
              );
            } else if (store === 'moral' && !inventario_submitted_moral) {
              shouldUpdate = true;
              await client.query(
                `UPDATE entradas_salidas 
                 SET inventario_inicial = inventario_inicial + $1, inventario_submitted_moral = TRUE
                 WHERE id_ingrediente = $2 AND fecha_inicio = $3`,
                [
                  ingrediente.cantidad_inventario,  // New value to add to inventario_inicial
                  ingrediente.id_ingrediente,
                  startOfWeek.toISOString().split('T')[0]  // fecha_inicio
                ]
              );
            } else if (store === 'bosques' && !inventario_submitted_bosques) {
              shouldUpdate = true;
              await client.query(
                `UPDATE entradas_salidas 
                 SET inventario_inicial = inventario_inicial + $1, inventario_submitted_bosques = TRUE
                 WHERE id_ingrediente = $2 AND fecha_inicio = $3`,
                [
                  ingrediente.cantidad_inventario,  // New value to add to inventario_inicial
                  ingrediente.id_ingrediente,
                  startOfWeek.toISOString().split('T')[0]  // fecha_inicio
                ]
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
