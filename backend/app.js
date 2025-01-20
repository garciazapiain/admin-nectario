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
const proveedoresRouter = require('./api/proveedores');
const unidadesRouter = require('./api/unidades');

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
app.use('/api/proveedores', proveedoresRouter);
app.use('/api/unidades', unidadesRouter);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

app.listen(port, () => {
  console.log('Server running on port', port);
});
