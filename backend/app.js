require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path'); // Add this line
const { Pool } = require('pg');
const authRoutes = require('./api/auth');
const submissionRoutes = require('./api/submissions');
const planeacionCompraRouter = require('./api/planeacion_compra');
const platillosRouter = require('./api/platillos');
const subPlatillosRouter = require('./api/subplatillos');
const ingredientesRouter = require('./api/ingredientes/ingredientes');
const ingredientImageUploadRouter = require('./api/ingredientes/ingredient_image');

const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/dist')));

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: isProduction ? process.env.DATABASE_URL : 'postgresql://juangarciazapiain:123@localhost:5432/inventarios',
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

app.use('/api/auth', authRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/planeacion_compra', planeacionCompraRouter);
app.use('/api/ingredient_image', ingredientImageUploadRouter);
app.use('/api/ingredientes', ingredientesRouter);
app.use('/api/platillos', platillosRouter);
app.use('/api/subplatillos', subPlatillosRouter);

app.get('/api/proveedores', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM proveedores');

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while retrieving data from the database' });
  } finally {
    client.release();
  }
});

app.get('/api/unidades', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT conname, pg_get_constraintdef(pg_constraint.oid)
      FROM pg_constraint
      INNER JOIN pg_class ON conrelid=pg_class.oid
      WHERE pg_class.relname='ingredientes' AND conname='ingredientes_unidad_check'
    `);

    const constraintDef = result.rows[0].pg_get_constraintdef;
    const unitsMatch = constraintDef.match(/ARRAY\[(.*)\]/);
    const units = unitsMatch ? unitsMatch[1].replace(/'::text/g, '').replace(/'/g, '').split(', ') : [];

    res.json(units);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while retrieving data from the database' });
  } finally {
    client.release();
  }
});

app.get('/api/purchase_orders', async (req, res) => {
  const client = await pool.connect();
  try {
    // Select all rows from purchase_orders table
    const result = await client.query('SELECT * FROM purchase_orders');

    // Send the result rows as the response
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching data from the database' });
  } finally {
    client.release();
  }
});

app.delete('/api/purchase_orders/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    // Begin a transaction
    await client.query('BEGIN');

    // Delete the related rows from the purchase_history_items table
    await client.query('DELETE FROM purchase_history_items WHERE purchase_order_id = $1', [req.params.id]);

    // Delete the row with the provided id from the purchase_orders table
    const result = await client.query('DELETE FROM purchase_orders WHERE id = $1', [req.params.id]);

    // Commit the transaction
    await client.query('COMMIT');

    // If no rows were deleted, send a 404 response
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Order not found' });
    } else {
      // Otherwise, send a 200 response
      res.status(200).json({ message: 'Order deleted successfully' });
    }
  } catch (err) {
    // If an error occurred, rollback the transaction
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'An error occurred while deleting data from the database' });
  } finally {
    client.release();
  }
});

app.post('/api/purchase_orders', async (req, res) => {
  const { articulosComprados, totalImporte, fecha, folio, emisor, xmldata } = req.body;

  function calculateWeekRange(date) {
    const inputDate = new Date(date);
    const dayOfWeek = inputDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Calculate Monday as the start of the week (if it's Sunday, set it to Monday)
    const startOfWeek = new Date(inputDate);
    const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setDate(inputDate.getDate() + offset);

    // Calculate Sunday as the end of the week
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);  // Sunday is 6 days after Monday

    return {
      fecha_inicio: startOfWeek.toISOString().split('T')[0], // Format as YYYY-MM-DD
      fecha_fin: endOfWeek.toISOString().split('T')[0]       // Format as YYYY-MM-DD
    };
  }

  const client = await pool.connect();
  try {
    console.log("Transaction started for new purchase order");

    await client.query('BEGIN');

    // Insert the purchase order with status and xmldata
    console.log("Inserting new purchase order:", { fecha, totalImporte, folio, emisor });
    const orderResult = await client.query(
      'INSERT INTO purchase_orders (fecha, totalImporte, folio, emisor, status, xmldata) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [fecha, totalImporte, folio, emisor, 'pendiente', xmldata]
    );
    const orderId = orderResult.rows[0].id;
    console.log("Inserted purchase order with ID:", orderId);

    const { fecha_inicio, fecha_fin } = calculateWeekRange(fecha);
    console.log(`Calculated week range: ${fecha_inicio} to ${fecha_fin}`);

    if (articulosComprados && articulosComprados.length > 0) {
      for (const item of articulosComprados) {
        console.log("Inserting purchase item:", item);
        await client.query(
          'INSERT INTO purchase_history_items (purchase_order_id, id_ingrediente, quantity, price_per_item, total_price) VALUES ($1, $2, $3, $4, $5)',
          [orderId, item.id_ingrediente, item.quantity, item.price, item.totalPrice]
        );

        console.log(`Checking if an existing entradas_salidas entry exists for ingredient ${item.id_ingrediente} and start date ${fecha_inicio}`);

        const existingEntry = await client.query(
          'SELECT * FROM entradas_salidas WHERE id_ingrediente = $1 AND fecha_inicio = $2',
          [item.id_ingrediente, fecha_inicio]
        );

        if (existingEntry.rows.length === 0) {
          console.log("No existing entradas_salidas entry found, inserting a new one");
          await client.query(
            'INSERT INTO entradas_salidas (id_ingrediente, fecha_inicio, fecha_fin, total_quantity, quantity_cedis, quantity_moral, quantity_campestre) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [
              item.id_ingrediente,
              fecha_inicio,
              fecha_fin,
              item.quantity,
              item.quantity,
              0,
              0
            ]
          );
        } else {
          console.log("Existing entradas_salidas entry found:", existingEntry.rows[0]);
          const oldTotalQuantity = existingEntry.rows[0].total_quantity;
          const newTotalQuantity = oldTotalQuantity + item.quantity;
          console.log(`Updating entradas_salidas: oldTotalQuantity = ${oldTotalQuantity}, itemQuantity = ${item.quantity}, newTotalQuantity = ${newTotalQuantity}`);

          await client.query(
            'UPDATE entradas_salidas SET total_quantity = total_quantity + $1, quantity_cedis = quantity_cedis + $2 WHERE id_ingrediente = $3 AND fecha_inicio = $4',
            [
              item.quantity,
              item.quantity,
              item.id_ingrediente,
              fecha_inicio
            ]
          );

          console.log("Entradas_salidas_compras updated successfully for ingredient:", item.id_ingrediente);
        }
      }
    }

    await client.query('COMMIT');
    console.log("Transaction committed successfully for purchase order:", orderId);
    res.json({ message: 'Purchase order created successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  } finally {
    client.release();
    console.log("Database connection released");
  }
});

app.post('/api/purchase_orders', async (req, res) => {
  const { articulosComprados, totalImporte, fecha, folio, emisor, xmldata } = req.body;

  function calculateWeekRange(date) {
    const inputDate = new Date(date);
    const dayOfWeek = inputDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Calculate Monday as the start of the week (if it's Sunday, set it to Monday)
    const startOfWeek = new Date(inputDate);
    const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;  // Set Sunday as the last day (adjust accordingly)
    startOfWeek.setDate(inputDate.getDate() + offset);

    // Calculate Sunday as the end of the week
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);  // Sunday is 6 days after Monday

    return {
      fecha_inicio: startOfWeek.toISOString().split('T')[0], // Format as YYYY-MM-DD
      fecha_fin: endOfWeek.toISOString().split('T')[0]       // Format as YYYY-MM-DD
    };
  }

  const client = await pool.connect();
  try {
    console.log("Transaction started for new purchase order");

    await client.query('BEGIN');

    console.log("Inserting new purchase order:", { fecha, totalImporte, folio, emisor });
    const orderResult = await client.query(
      'INSERT INTO purchase_orders (fecha, totalImporte, folio, emisor, status, xmldata) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [fecha, totalImporte, folio, emisor, 'pendiente', xmldata]
    );
    const orderId = orderResult.rows[0].id;
    console.log("Inserted purchase order with ID:", orderId);

    const { fecha_inicio, fecha_fin } = calculateWeekRange(fecha);
    console.log(`Calculated week range: ${fecha_inicio} to ${fecha_fin}`);

    if (articulosComprados && articulosComprados.length > 0) {
      for (const item of articulosComprados) {
        console.log("Inserting purchase item:", item);
        await client.query(
          'INSERT INTO purchase_history_items (purchase_order_id, id_ingrediente, quantity, price_per_item, total_price) VALUES ($1, $2, $3, $4, $5)',
          [orderId, item.id_ingrediente, item.quantity, item.price, item.totalPrice]
        );

        console.log(`Checking if an existing entradas_salidas entry exists for ingredient ${item.id_ingrediente} and start date ${fecha_inicio}`);

        const existingEntry = await client.query(
          'SELECT * FROM entradas_salidas WHERE id_ingrediente = $1 AND fecha_inicio = $2',
          [item.id_ingrediente, fecha_inicio]
        );

        if (existingEntry.rows.length === 0) {
          console.log("No existing entradas_salidas entry found, inserting a new one");
          await client.query(
            'INSERT INTO entradas_salidas (id_ingrediente, fecha_inicio, fecha_fin, total_quantity, quantity_cedis, quantity_moral, quantity_campestre) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [
              item.id_ingrediente,
              fecha_inicio,
              fecha_fin,
              parseFloat(item.quantity),
              parseFloat(item.quantity),
              0,
              0
            ]
          );
        } else {
          console.log("Existing entradas_salidas entry found:", existingEntry.rows[0]);

          console.log('Before calculation:', {
            oldTotalQuantity: existingEntry.rows[0].total_quantity,
            itemQuantity: item.quantity,
          });
          const oldTotalQuantity = Number(existingEntry.rows[0].total_quantity) || 0;
          const itemQuantity = Number(item.quantity) || 0;
          const newTotalQuantity = oldTotalQuantity + itemQuantity;
          console.log('After calculation:', { oldTotalQuantity, itemQuantity, newTotalQuantity });

          await client.query(
            'UPDATE entradas_salidas SET total_quantity = $1, quantity_cedis = quantity_cedis::numeric + $2 WHERE id_ingrediente = $3 AND fecha_inicio = $4',
            [
              newTotalQuantity,
              itemQuantity,
              item.id_ingrediente,
              fecha_inicio
            ]
          );

          console.log("Entradas_salidas_compras updated successfully for ingredient:", item.id_ingrediente);
        }
      }
    }

    await client.query('COMMIT');
    console.log("Transaction committed successfully for purchase order:", orderId);
    res.json({ message: 'Purchase order created successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  } finally {
    client.release();
    console.log("Database connection released");
  }
});


app.put('/api/purchase_orders/:id', async (req, res) => {
  const { id } = req.params;
  const { fecha, folio, emisor, items, totalimporte, status } = req.body;

  // Define the calculateWeekRange function
  function calculateWeekRange(date) {
    const inputDate = new Date(date);
    const dayOfWeek = inputDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Calculate Monday as the start of the week (if it's Sunday, set it to Monday)
    const startOfWeek = new Date(inputDate);
    const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;  // Set Sunday as the last day (adjust accordingly)
    startOfWeek.setDate(inputDate.getDate() + offset);

    // Calculate Sunday as the end of the week
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);  // Sunday is 6 days after Monday

    return {
      fecha_inicio: startOfWeek.toISOString().split('T')[0], // Format as YYYY-MM-DD
      fecha_fin: endOfWeek.toISOString().split('T')[0]       // Format as YYYY-MM-DD
    };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('Transaction started for purchase_order:', id);

    // If status is provided, update it separately
    if (status) {
      console.log('Updating status for purchase_order:', id, 'New status:', status);
      await client.query(
        'UPDATE purchase_orders SET status = $1 WHERE id = $2',
        [status, id]
      );
    }

    // If other fields are provided, update them
    if (fecha || folio || emisor || totalimporte) {
      console.log('Updating other fields for purchase_order:', id);
      await client.query(
        'UPDATE purchase_orders SET fecha = $1, folio = $2, emisor = $3, totalimporte = $4 WHERE id = $5',
        [fecha, folio, emisor, totalimporte, id]
      );
    }

    // Retrieve original items to compare quantities
    console.log('Fetching original items for purchase_order:', id);
    const originalItems = await client.query('SELECT * FROM purchase_history_items WHERE purchase_order_id = $1', [id]);

    // Delete existing items for the order (if necessary)
    if (items && items.length > 0) {
      console.log('Deleting old items for purchase_order:', id);
      await client.query('DELETE FROM purchase_history_items WHERE purchase_order_id = $1', [id]);

      for (const item of items) {
        console.log('Inserting new item for purchase_order:', id, 'Item:', item);
        await client.query(
          'INSERT INTO purchase_history_items (purchase_order_id, id_ingrediente, quantity, price_per_item, total_price) VALUES ($1, $2, $3, $4, $5)',
          [id, item.id_ingrediente || null, item.quantity, item.price_per_item || 0, item.total_price]
        );

        const { fecha_inicio, fecha_fin } = calculateWeekRange(fecha); // Use corrected week range
        console.log('Calculated week range:', { fecha_inicio, fecha_fin });

        // Find original item data to compare
        const originalItem = originalItems.rows.find(orig => orig.id_ingrediente === item.id_ingrediente);
        const originalQuantity = originalItem ? originalItem.quantity : 0;
        const quantityDifference = item.quantity - originalQuantity;
        console.log('Quantity difference for ingredient:', item.id_ingrediente, 'Difference:', quantityDifference);

        // Check if the entradas_salidas entry already exists for this item and week
        const existingEntry = await client.query(
          'SELECT * FROM entradas_salidas WHERE id_ingrediente = $1 AND fecha_inicio = $2',
          [item.id_ingrediente, fecha_inicio]
        );
        console.log('Existing entry found:', existingEntry.rows.length);

        if (existingEntry.rows.length === 0) {
          // Insert a new entry if one doesn't exist
          console.log('Inserting new entradas_salidas entry for ingredient:', item.id_ingrediente);
          await client.query(
            'INSERT INTO entradas_salidas (id_ingrediente, fecha_inicio, fecha_fin, total_quantity, quantity_cedis, quantity_moral, quantity_campestre) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [
              item.id_ingrediente,
              fecha_inicio,
              fecha_fin,
              item.quantity,  // Set initial total quantity as the new purchase quantity
              item.quantity,  // Everything assigned to CEDIS initially
              0,              // Start with zero for Moral
              0               // Start with zero for Campestre
            ]
          );
        } else {
          // Update the existing entry based on the difference in quantity
          console.log('Updating existing entradas_salidas entry for ingredient:', item.id_ingrediente);
          await client.query(
            'UPDATE entradas_salidas SET total_quantity = total_quantity + $1, quantity_cedis = quantity_cedis + $2 WHERE id_ingrediente = $3 AND fecha_inicio = $4',
            [
              quantityDifference,       // Adjust total_quantity based on the difference
              quantityDifference,       // Adjust quantity_cedis based on the difference
              item.id_ingrediente,
              fecha_inicio
            ]
          );
        }
      }
    }

    console.log('Committing transaction for purchase_order:', id);
    await client.query('COMMIT');
    res.json({ message: 'Purchase order updated successfully' });
  } catch (error) {
    console.error('Error occurred for purchase_order:', id, 'Error:', error);
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Database error' });
  } finally {
    client.release();
    console.log('Database connection released for purchase_order:', id);
  }
});

app.get('/api/purchase_orders/analisis-consumo', async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'Start date and end date are required' });
  }

  const client = await pool.connect();
  try {
    // Query to filter purchase orders by date range and join with purchase_history_items
    const result = await client.query(`
      SELECT 
        ph.id_ingrediente, 
        SUM(ph.quantity) AS total_quantity
      FROM purchase_orders po
      JOIN purchase_history_items ph ON po.id = ph.purchase_order_id
      WHERE po.fecha >= $1 AND po.fecha <= $2
      GROUP BY ph.id_ingrediente
    `, [startDate, endDate]);

    // Send the aggregated result rows as the response
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching data from the database' });
  } finally {
    client.release();
  }
});

app.get('/api/historial_insumos', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        ingredientes.nombre, 
        ingredientes.id_ingrediente,
        ingredientes.unidad,
        ingredientes.precio,
        ingredientes.merma,
        SUM(purchase_history_items.quantity) AS total_quantity, 
        SUM(purchase_history_items.total_price) AS total_price
      FROM 
        ingredientes 
      JOIN 
        purchase_history_items 
      ON 
        ingredientes.id_ingrediente = purchase_history_items.id_ingrediente
      GROUP BY 
        ingredientes.nombre,
        ingredientes.id_ingrediente,
        ingredientes.precio,
        ingredientes.merma,
        ingredientes.unidad;
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching data from the database' });
  } finally {
    client.release();
  }
});

app.get('/api/historial_insumos/insumo/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const id = req.params.id;
    const result = await client.query(`
      SELECT 
        purchase_history_items.*,
        ingredientes.nombre,
        purchase_orders.fecha,
        purchase_orders.emisor,
        purchase_orders.folio
      FROM 
        purchase_history_items 
      JOIN 
        ingredientes 
      ON 
        purchase_history_items.id_ingrediente = ingredientes.id_ingrediente
      JOIN 
        purchase_orders 
      ON 
        purchase_history_items.purchase_order_id = purchase_orders.id 
      WHERE 
        purchase_history_items.id_ingrediente = $1
    `, [id]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching data from the database' });
  } finally {
    client.release();
  }
});

app.get('/api/historialcompra/compra/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const id = req.params.id;
    const purchaseOrderResult = await client.query(`
      SELECT * FROM purchase_orders WHERE id = $1
    `, [id]);

    const itemsResult = await client.query(`
      SELECT 
        purchase_history_items.*,
        ingredientes.nombre, ingredientes.unidad
      FROM 
        purchase_history_items 
      JOIN 
        ingredientes 
      ON 
        purchase_history_items.id_ingrediente = ingredientes.id_ingrediente
      WHERE 
        purchase_history_items.purchase_order_id = $1
    `, [id]);

    const response = {
      ...purchaseOrderResult.rows[0],
      items: itemsResult.rows
    };

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching data from the database' });
  } finally {
    client.release();
  }
});

app.post('/api/consumoinsumos/cargarventas', async (req, res) => {
  const { store, startDate, endDate, items } = req.body;
  const client = await pool.connect();
  try {
    // Insert into SalesLog table
    const salesLogResult = await client.query('INSERT INTO VentasLog (store, startDate, endDate) VALUES ($1, $2, $3) RETURNING *', [store, startDate, endDate]);

    // Get the id of the inserted sales log
    const ventasLogId = salesLogResult.rows[0].id;

    // Insert each item into the SalesData table
    for (const item of items) {
      // Check if a similar record already exists
      const existingRecord = await client.query('SELECT * FROM VentasData INNER JOIN VentasLog ON VentasData.ventasLogId = VentasLog.id WHERE VentasLog.store = $1 AND VentasLog.startDate <= $2 AND VentasLog.endDate >= $3 AND VentasData.clavepos = $4', [store, endDate, startDate, item.clavepos]);
      if (existingRecord.rows.length > 0) {
        continue; // Skip this item and continue with the next one
      }

      await client.query('INSERT INTO VentasData (ventasLogId, clavepos, descripcion, cantidad) VALUES ($1, $2, $3, $4)', [ventasLogId, item.clavepos, item.descripcion, item.cantidad]);
    }

    res.json({ message: 'Data successfully inserted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while inserting data into the database' });
  } finally {
    client.release();
  }
});

app.get('/api/consumption/:store', async (req, res) => {
  const { store } = req.params;
  const { startDate, endDate } = req.query;
  const client = await pool.connect();

  try {
    const result = await client.query(`
       SELECT 
    i.id_ingrediente,
    i.unidad,
    i.proveedor,
    i.nombre,
    i.producto_clave,
    i.precio,
    i.merma,
    ROUND(SUM(COALESCE(p.consumo_platillos, 0))::numeric, 2) AS consumo_platillos,
    ROUND(SUM(COALESCE(sp.consumo_subplatillos, 0))::numeric, 2) AS consumo_subplatillos,
    ROUND((SUM(COALESCE(p.consumo_platillos, 0)) + SUM(COALESCE(sp.consumo_subplatillos, 0)))::numeric, 2) AS total_consumido
FROM 
    ingredientes i
LEFT JOIN (
    SELECT 
        pi.id_ingrediente,
        SUM(vd.cantidad * pi.cantidad) AS consumo_platillos
    FROM 
        (
            SELECT 
                SUM(vd.cantidad) AS cantidad,
                vd.clavepos
            FROM 
                ventasdata vd
            LEFT JOIN 
                ventaslog vl ON vd.ventaslogid = vl.id
            WHERE 
                vl.startdate = $1 AND vl.enddate = $2 AND vl.store = $3
            GROUP BY
                vd.clavepos
        ) vd
    RIGHT JOIN 
        platillos p ON vd.clavepos = p.clavepos
    RIGHT JOIN 
        platillos_ingredientes pi ON p.id_platillo = pi.id_platillo
    GROUP BY pi.id_ingrediente
) p ON i.id_ingrediente = p.id_ingrediente
LEFT JOIN (
    SELECT 
        spi.id_ingrediente,
        SUM(psi.cantidad * (spi.cantidad / sp.rendimiento) * vd.cantidad) AS consumo_subplatillos
    FROM 
        (
            SELECT 
                SUM(vd.cantidad) AS cantidad,
                vd.clavepos
            FROM 
                ventasdata vd
            LEFT JOIN 
                ventaslog vl ON vd.ventaslogid = vl.id
            WHERE 
                vl.startdate = $1 AND vl.enddate = $2 AND vl.store = $3
            GROUP BY
                vd.clavepos
        ) vd
    RIGHT JOIN 
        platillos p ON vd.clavepos = p.clavepos
    RIGHT JOIN 
        platillos_subplatillos psi ON p.id_platillo = psi.id_platillo
    RIGHT JOIN 
        subplatillos sp ON psi.id_subplatillo = sp.id_subplatillo
    RIGHT JOIN 
        subplatillos_ingredientes spi ON sp.id_subplatillo = spi.id_subplatillo
    GROUP BY spi.id_ingrediente
) sp ON i.id_ingrediente = sp.id_ingrediente
GROUP BY i.id_ingrediente, i.unidad, i.proveedor, i.nombre, i.producto_clave, i.precio, i.merma
ORDER BY total_consumido DESC;
`, 
[startDate, endDate, store]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while executing the query' });
  } finally {
    client.release();
  }
});

app.get('/api/consumption/:id/:store', async (req, res) => {
  const { id, store } = req.params;
  const client = await pool.connect();

  try {
    const result = await client.query(`
      SELECT 
          id_ingrediente,
          unidad,
          proveedor,
          nombre,
          producto_clave,
          precio,
          ROUND(SUM(consumo_platillos)::numeric, 2) AS consumo_platillos,
          ROUND(SUM(consumo_subplatillos)::numeric, 2) AS consumo_subplatillos,
          ROUND((SUM(consumo_platillos) + SUM(consumo_subplatillos))::numeric, 2) AS total_consumido
      FROM 
          (
              SELECT 
                  pi.id_ingrediente AS id_ingrediente,
                  i.unidad AS unidad,
                  i.proveedor AS proveedor,
                  i.nombre AS nombre,
                  i.producto_clave AS producto_clave,
                  i.precio AS precio,
                  SUM(vd.cantidad * pi.cantidad) AS consumo_platillos,
                  0 AS consumo_subplatillos
              FROM 
                  (
                      SELECT 
                          SUM(vd.cantidad) AS cantidad,
                          vd.clavepos
                      FROM 
                          ventasdata vd
                      INNER JOIN 
                          ventaslog vl ON vd.ventaslogid = vl.id
                      WHERE 
                          vl.id = $1 AND vl.store = $2
                      GROUP BY
                          vd.clavepos
                  ) vd
              INNER JOIN 
                  platillos p ON vd.clavepos = p.clavepos
              INNER JOIN 
                  platillos_ingredientes pi ON p.id_platillo = pi.id_platillo
              INNER JOIN 
                  ingredientes i ON pi.id_ingrediente = i.id_ingrediente
              GROUP BY pi.id_ingrediente, i.unidad, i.proveedor, i.nombre, i.producto_clave, i.precio
              UNION ALL
              SELECT 
                  spi.id_ingrediente AS id_ingrediente,
                  i.unidad AS unidad,
                  i.proveedor AS proveedor,
                  i.nombre AS nombre,
                  i.producto_clave AS producto_clave,
                  i.precio AS precio,
                  0 AS consumo_platillos,
                  SUM(psi.cantidad * (spi.cantidad / sp.rendimiento)) AS consumo_subplatillos
              FROM 
                  (
                      SELECT 
                          SUM(vd.cantidad) AS cantidad,
                          vd.clavepos
                      FROM 
                          ventasdata vd
                      INNER JOIN 
                          ventaslog vl ON vd.ventaslogid = vl.id
                      WHERE 
                          vl.id = $1 AND vl.store = $2
                      GROUP BY
                          vd.clavepos
                  ) vd
              INNER JOIN 
                  platillos p ON vd.clavepos = p.clavepos
              INNER JOIN 
                  platillos_subplatillos psi ON p.id_platillo = psi.id_platillo
              INNER JOIN 
                  subplatillos sp ON psi.id_subplatillo = sp.id_subplatillo
              INNER JOIN 
                  subplatillos_ingredientes spi ON sp.id_subplatillo = spi.id_subplatillo
              INNER JOIN 
                  ingredientes i ON spi.id_ingrediente = i.id_ingrediente
              GROUP BY spi.id_ingrediente, i.unidad, i.proveedor, i.nombre, i.producto_clave, i.precio, psi.cantidad, sp.rendimiento, spi.cantidad
          ) t
      GROUP BY id_ingrediente, unidad, proveedor, nombre, producto_clave, precio;
    `, [id, store]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while executing the query' });
  } finally {
    client.release();
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

app.listen(port, () => {
  console.log('Server running on port', port);
});
