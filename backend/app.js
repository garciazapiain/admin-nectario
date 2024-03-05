require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path'); // Add this line
const { Pool } = require('pg');

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

app.post('/api/register', async (req, res) => {
  const client = await pool.connect();
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    await client.query('INSERT INTO users (name, password) VALUES ($1, $2)', [req.body.name, hashedPassword]);
    res.status(201).send('User registered');
  } catch (err) {
    res.status(500).send(err);
  } finally {
    client.release();
  }
});

app.post('/api/login', async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, password } = req.body;
    if (!name || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const result = await client.query('SELECT * FROM users WHERE name = $1', [name]);
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ error: 'User not found.' });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(403).json({ error: 'Invalid password.' });
    }

    const accessToken = jwt.sign({ name: user.name, isAdmin: user.isAdmin }, process.env.ACCESS_TOKEN_SECRET);
    res.json({ accessToken, isAdmin: user.isAdmin });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  } finally {
    client.release();
  }
});

app.get('/api/platillos', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM platillos');
    res.json(result.rows);
  } finally {
    client.release();
  }
});

app.post('/api/platillos', async (req, res) => {
  const { nombre } = req.body;
  const client = await pool.connect();
  try {
    const result = await client.query('INSERT INTO platillos (nombre) VALUES ($1) RETURNING *', [nombre]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while inserting data into the database' });
  } finally {
    client.release();
  }
});

app.get('/api/platillo/:id', async (req, res) => {
  const { id } = req.params;
  const includeSubplatillos = req.query.includeSubplatillos === 'true';
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT *, unidades_vendidas FROM platillos WHERE id_platillo = $1', [id]);
    let ingredientsQuery;
    if (includeSubplatillos) {
      ingredientsQuery = `
      SELECT i.nombre, i.id_ingrediente::text, i.unidad, pi.cantidad, NULL as rendimiento, false as is_subplatillo, NULL as subplatillo_cantidad
      FROM ingredientes i
      INNER JOIN platillos_ingredientes pi ON i.id_ingrediente = pi.id_ingrediente
      WHERE pi.id_platillo = $1
      UNION
      SELECT s.nombre, 'sub_' || s.id_subplatillo::text, s.unidad, ps.cantidad, s.rendimiento, true as is_subplatillo, ps.cantidad as subplatillo_cantidad
      FROM subplatillos s
      INNER JOIN platillos_subplatillos ps ON s.id_subplatillo = ps.id_subplatillo
      WHERE ps.id_platillo = $1
      `;
    } else {
      ingredientsQuery = `
        SELECT i.nombre, i.id_ingrediente, i.unidad, i.precio, pi.cantidad, NULL as rendimiento, false as is_subplatillo, NULL as subplatillo_cantidad
        FROM ingredientes i
        INNER JOIN platillos_ingredientes pi ON i.id_ingrediente = pi.id_ingrediente
        WHERE pi.id_platillo = $1
        UNION
        SELECT i.nombre, i.id_ingrediente, i.unidad, i.precio, si.cantidad, s.rendimiento, true as is_subplatillo, ps.cantidad as subplatillo_cantidad
        FROM ingredientes i
        INNER JOIN subplatillos_ingredientes si ON i.id_ingrediente = si.id_ingrediente
        INNER JOIN platillos_subplatillos ps ON si.id_subplatillo = ps.id_subplatillo
        INNER JOIN subplatillos s ON s.id_subplatillo = ps.id_subplatillo
        WHERE ps.id_platillo = $1
      `;
    }
    const ingredientsResult = await client.query(ingredientsQuery, [id]);
    const platillo = result.rows[0];
    platillo.ingredients = ingredientsResult.rows;
    res.json(platillo);
  } finally {
    client.release();
  }
});

app.post('/api/platillos/:idPlatillo/ingredientes', async (req, res) => {
  const { idPlatillo } = req.params;
  const { id_ingrediente, cantidad } = req.body;
  const client = await pool.connect();

  try {
    const result = await client.query(
      'INSERT INTO platillos_ingredientes (id_platillo, id_ingrediente, cantidad) VALUES ($1, $2, $3) RETURNING *',
      [idPlatillo, id_ingrediente, cantidad]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while inserting data into the database' });
  } finally {
    client.release();
  }
});

app.post('/api/platillos/:idPlatillo/subplatillos', async (req, res) => {
  const { idPlatillo } = req.params;
  const { id_subplatillo, cantidad } = req.body;
  const client = await pool.connect();

  try {
    const result = await client.query(
      'INSERT INTO platillos_subplatillos (id_platillo, id_subplatillo, cantidad) VALUES ($1, $2, $3) RETURNING *',
      [idPlatillo, id_subplatillo, cantidad]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while inserting data into the database' });
  } finally {
    client.release();
  }
});

app.get('/api/subplatillos', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM subplatillos');
    res.json(result.rows);
  } finally {
    client.release();
  }
});

app.post('/api/subplatillos', async (req, res) => {
  const { nombre, unidad, rendimiento } = req.body;
  const client = await pool.connect();
  try {
    const result = await client.query('INSERT INTO subplatillos (nombre, unidad, rendimiento) VALUES ($1, $2, $3) RETURNING *', [nombre, unidad, rendimiento]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while inserting data into the database' });
  } finally {
    client.release();
  }
});

app.get('/api/subplatillo/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM subplatillos WHERE id_subplatillo = $1', [id]);
    const ingredientsResult = await client.query(`
      SELECT i.nombre, i.id_ingrediente, i.unidad, i.precio, si.cantidad 
      FROM ingredientes i
      INNER JOIN subplatillos_ingredientes si ON i.id_ingrediente = si.id_ingrediente
      WHERE si.id_subplatillo = $1
    `, [id]);
    const subplatillo = result.rows[0];
    subplatillo.ingredients = ingredientsResult.rows;
    res.json(subplatillo);
  } finally {
    client.release();
  }
});

app.post('/api/subplatillos/:idSubPlatillo/ingredientes', async (req, res) => {
  const { idSubPlatillo } = req.params;
  const { id_ingrediente, cantidad } = req.body;
  const client = await pool.connect();

  try {
    const result = await client.query(
      'INSERT INTO subplatillos_ingredientes (id_subplatillo, id_ingrediente, cantidad) VALUES ($1, $2, $3) RETURNING *',
      [idSubPlatillo, id_ingrediente, cantidad]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while inserting data into the database' });
  } finally {
    client.release();
  }
});

app.get('/api/ingredientes', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        nombre, 
        id_ingrediente, 
        unidad, 
        precio,
        proveedor, 
        proveedor_id,
        producto_clave
      FROM ingredientes
    `);
    res.json(result.rows)
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  } finally {
    client.release();
  }
});

app.get('/api/ingredientes/demanda', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
    SELECT 
    nombre, 
    id_ingrediente, 
    unidad, 
    precio,
    proveedor, 
    proveedor_id,
    producto_clave,
    SUM(cantidad_platillo) AS cantidad_platillo,
    SUM(cantidad_subplatillo) AS cantidad_subplatillo,
    SUM(rendimiento_subplatillo) AS rendimiento_subplatillo,
    SUM(unidades_vendidas_platillo) AS unidades_vendidas_platillo,
    SUM(total_platillo) AS total_platillo,
    SUM(total_subplatillo) AS total_subplatillo,
    SUM(total_usado) AS total_usado
    FROM (
      (
      SELECT 
          i.nombre AS nombre, 
          i.id_ingrediente, 
          i.unidad, 
          i.precio, 
          i.proveedor,
          i.proveedor_id,
          i.producto_clave,
          COALESCE(SUM(pi.cantidad), 0) AS cantidad_platillo,
          0 AS cantidad_subplatillo,
          0 AS rendimiento_subplatillo,
          COALESCE(SUM(p.unidades_vendidas), 0) AS unidades_vendidas_platillo,
          COALESCE(SUM(pi.cantidad * p.unidades_vendidas), 0) AS total_platillo,
          0 AS total_subplatillo,
          COALESCE(SUM(pi.cantidad * p.unidades_vendidas), 0) AS total_usado
      FROM ingredientes i
      LEFT JOIN platillos_ingredientes pi ON i.id_ingrediente = pi.id_ingrediente
      LEFT JOIN platillos p ON pi.id_platillo = p.id_platillo
      GROUP BY i.nombre, i.id_ingrediente, i.unidad, i.precio, i.proveedor, i.proveedor_id, i.producto_clave
  )
  UNION
  (
      SELECT 
          i.nombre AS nombre, 
          i.id_ingrediente, 
          i.unidad, 
          i.precio, 
          i.proveedor,
          i.proveedor_id,
          i.producto_clave,
          0 AS cantidad_platillo,
          COALESCE(SUM(psi.cantidad), 0) AS cantidad_subplatillo,
          COALESCE(SUM(sp.rendimiento), 0) AS rendimiento_subplatillo,
          COALESCE(SUM(p.unidades_vendidas), 0) AS unidades_vendidas_platillo,
          0 AS total_platillo,
          COALESCE(SUM(spi.cantidad * psi.cantidad / sp.rendimiento * p.unidades_vendidas), 0) AS total_subplatillo,
          COALESCE(SUM(spi.cantidad * psi.cantidad / sp.rendimiento * p.unidades_vendidas), 0) AS total_usado
      FROM ingredientes i
      LEFT JOIN subplatillos_ingredientes spi ON i.id_ingrediente = spi.id_ingrediente
      LEFT JOIN subplatillos sp ON spi.id_subplatillo = sp.id_subplatillo
      LEFT JOIN platillos_subplatillos psi ON sp.id_subplatillo = psi.id_subplatillo
      LEFT JOIN platillos p ON psi.id_platillo = p.id_platillo
      GROUP BY i.nombre, i.id_ingrediente, i.unidad, i.precio, i.proveedor, i.proveedor_id, i.producto_clave
  )
  ) AS subquery
  GROUP BY nombre, id_ingrediente, unidad, precio, proveedor, proveedor_id, producto_clave
  `);
    res.json(result.rows)
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

app.post('/api/ingredientes', async (req, res) => {
  const { nombre, unidad, precio } = req.body;
  const client = await pool.connect();
  try {
    const result = await client.query('INSERT INTO ingredientes (nombre, unidad, precio) VALUES ($1, $2, $3) RETURNING *', [nombre, unidad, precio]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while inserting data into the database' });
  } finally {
    client.release();
  }
});

app.get('/api/ingrediente/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM ingredientes WHERE id_ingrediente = $1', [id]);
    const platillosResult = await client.query(`
    SELECT p.nombre, p.id_platillo, 'Platillo' AS type
    FROM platillos p
    INNER JOIN platillos_ingredientes pi ON p.id_platillo = pi.id_platillo
    WHERE pi.id_ingrediente = $1
    UNION
    SELECT sp.nombre, sp.id_subplatillo, 'Subplatillo' AS type
    FROM subplatillos sp
    INNER JOIN subplatillos_ingredientes si ON sp.id_subplatillo = si.id_subplatillo
    WHERE si.id_ingrediente = $1
  `, [id]);
    const ingrediente = result.rows[0];
    ingrediente.platillos = platillosResult.rows;
    res.json(ingrediente);
  } finally {
    client.release();
  }
});

app.post('/api/ingredientes', async (req, res) => {
  const { nombre, unidad, precio } = req.body;
  const client = await pool.connect();
  try {
    const result = await client.query('INSERT INTO ingredientes (nombre, unidad, precio) VALUES ($1, $2, $3) RETURNING *', [nombre, unidad, precio]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while inserting data into the database' });
  } finally {
    client.release();
  }
});

app.post('/api/submissions', async (req, res) => {
  const { store, timestamp, ingredients } = req.body;
  const client = await pool.connect();
  try {
    // Convert ingredients to JSON string
    const compra = JSON.stringify(ingredients);

    // Insert into submissions table
    const result = await client.query('INSERT INTO submissions (store, timestamp, compra) VALUES ($1, $2, $3) RETURNING *', [store, timestamp, compra]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while inserting data into the database' });
  } finally {
    client.release();
  }
});

app.get('/api/submissions', async (req, res) => {
  const client = await pool.connect();
  try {
    // Query the submissions table
    const result = await client.query('SELECT * FROM submissions');

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while retrieving data from the database' });
  } finally {
    client.release();
  }
});

app.get('/api/proveedores', async (req, res) => {
  const client = await pool.connect();
  try {
    // Query the submissions table
    const result = await client.query('SELECT * FROM proveedores');

    res.json(result.rows);
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
  console.log(`Server is running on port ${port}`);
});
// app.listen(3000, () => console.log('Server listening on port 3000'));