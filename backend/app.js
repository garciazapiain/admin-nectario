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
