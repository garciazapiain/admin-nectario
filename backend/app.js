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
const consumptionRouter = require('./api/consumption');

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
app.use('/api/consumption', consumptionRouter);

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

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

app.listen(port, () => {
  console.log('Server running on port', port);
});
