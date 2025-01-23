require('dotenv').config();
const express = require('express');
const cors = require('cors');

const path = require('path');
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
const staticPath = path.join(__dirname, 'path_to_your_frontend_build');
app.use(express.static(staticPath, {
  setHeaders: (res, filePath) => {
    if (path.extname(filePath).match(/\.(js|css|html|webp)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

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
