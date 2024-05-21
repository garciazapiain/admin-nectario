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
    const result = await client.query('INSERT INTO platillos (id_platillo, nombre) VALUES ((SELECT COALESCE(MAX(id_platillo), 0) + 1 FROM platillos), $1) RETURNING *', [nombre]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while inserting data into the database' });
  } finally {
    client.release();
  }
});

app.put('/api/platillos/:id', async (req, res) => {
  const { nombre } = req.body;
  const { id } = req.params;
  const client = await pool.connect();

  try {
    const result = await client.query(
      'UPDATE platillos SET nombre = $1 WHERE id_platillo = $2 RETURNING nombre',
      [nombre, id]
    );

    res.json({ nombre: result.rows[0].nombre });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  } finally {
    client.release();
  }
});

app.post('/api/platillos/:id/duplicate', async (req, res) => {
  const { id } = req.params;
  try {
    const client = await pool.connect();
    await client.query('BEGIN');

    const sqlQuery1 = `
      INSERT INTO platillos (nombre, created_at, updated_at, unidades_vendidas, clavepos)
      SELECT nombre || ' COPIA', created_at, updated_at, unidades_vendidas, clavepos
      FROM platillos
      WHERE id_platillo = ${id}
      RETURNING id_platillo
    `;
    const { rows } = await client.query(sqlQuery1);
    const newId = rows[0].id_platillo;

    const sqlQuery2 = `
      INSERT INTO platillos_ingredientes (id_platillo, id_ingrediente, cantidad)
      SELECT ${newId}, id_ingrediente, cantidad
      FROM platillos_ingredientes
      WHERE id_platillo = ${id}
    `;
    await client.query(sqlQuery2);

    const sqlQuery3 = `
      INSERT INTO platillos_subplatillos (id_platillo, id_subplatillo, cantidad)
      SELECT ${newId}, id_subplatillo, cantidad
      FROM platillos_subplatillos
      WHERE id_platillo = ${id}
    `;
    await client.query(sqlQuery3);

    await client.query('COMMIT');
    client.release();

    res.json({ message: 'Platillo duplicated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    client.release();
    console.error(error);
    res.status(500).json({ error: 'An error occurred while duplicating the platillo' });
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

app.put('/api/platillos/:idPlatillo/ingredientes/:idIngrediente', async (req, res) => {
  const { idPlatillo, idIngrediente } = req.params;
  const { cantidad } = req.body;
  const client = await pool.connect();

  try {
    const result = await client.query(
      'UPDATE platillos_ingredientes SET cantidad = $1 WHERE id_platillo = $2 AND id_ingrediente = $3 RETURNING *',
      [cantidad, idPlatillo, idIngrediente]
    );

    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Resource not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while updating data in the database' });
  } finally {
    client.release();
  }
});

app.delete('/api/platillos/:idPlatillo/ingredientes/:idIngrediente', async (req, res) => {
  const { idPlatillo, idIngrediente } = req.params;
  const client = await pool.connect();

  try {
    const result = await client.query(
      'DELETE FROM platillos_ingredientes WHERE id_platillo = $1 AND id_ingrediente = $2 RETURNING *',
      [idPlatillo, idIngrediente]
    );

    if (result.rows.length > 0) {
      res.json({ message: 'Resource deleted successfully' });
    } else {
      res.status(404).json({ error: 'Resource not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while deleting data from the database' });
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

app.put('/api/platillos/:idPlatillo', async (req, res) => {
  const { idPlatillo } = req.params;
  const { clavepos } = req.body;
  const client = await pool.connect();

  try {
    const result = await client.query(
      'UPDATE platillos SET clavepos = $1 WHERE id_platillo = $2 RETURNING *',
      [clavepos, idPlatillo]
    );

    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Platillo not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while updating data in the database' });
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
      SELECT i.*, array_agg(f.nombre) as frecuencias_inventario
      FROM ingredientes i
      LEFT JOIN ingredientes_frecuencia if ON i.id_ingrediente = if.id_ingrediente
      LEFT JOIN frecuencia_inventario f ON if.frecuencia_inventario_id = f.id
      GROUP BY i.id_ingrediente
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

app.get('/api/pronosticodemandainsumos', async (req, res) => {
  const client = await pool.connect();
  // const platillos = [{ id: 1, cantidad: 1 }, { id: 9, cantidad: 2 }];
  const platillos = [{ id: 9, cantidad: 1 }];

  try {
    let params = [];
    let placeholders = '';

    for (let i = 0; i < platillos.length; i++) {
      params.push(platillos[i].id, platillos[i].cantidad);
      placeholders += `($${2 * i + 1}, $${2 * i + 2}),`;
    }
    placeholders = placeholders.slice(0, -1);
    const result = await client.query(`
    SELECT 
      i.nombre, 
      i.id_ingrediente, 
      i.unidad, 
      i.precio,
      i.proveedor, 
      i.proveedor_id,
      i.producto_clave,
      SUM(pi.cantidad * v.cantidad::numeric) AS cantidad_platillo,
      COALESCE(SUM(si.cantidad * ps.cantidad * v.cantidad::numeric), 0) AS cantidad_subplatillo
    FROM ingredientes i
    LEFT JOIN platillos_ingredientes pi ON i.id_ingrediente = pi.id_ingrediente
    LEFT JOIN platillos_subplatillos ps ON pi.id_platillo = ps.id_platillo
    LEFT JOIN subplatillos_ingredientes si ON i.id_ingrediente = si.id_ingrediente
    INNER JOIN (VALUES ${placeholders}) AS v(id_platillo, cantidad) ON (pi.id_platillo = v.id_platillo::integer OR ps.id_subplatillo = v.id_platillo::integer)
    GROUP BY i.nombre, i.id_ingrediente, i.unidad, i.precio, i.proveedor, i.proveedor_id, i.producto_clave
  `, params);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

app.get('/api/ingrediente/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT i.*, array_agg(f.nombre) as frecuencias_inventario
      FROM ingredientes i
      LEFT JOIN ingredientes_frecuencia if ON i.id_ingrediente = if.id_ingrediente
      LEFT JOIN frecuencia_inventario f ON if.frecuencia_inventario_id = f.id
      WHERE i.id_ingrediente = $1
      GROUP BY i.id_ingrediente
    `, [id]);
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
  const { nombre, unidad, precio, proveedor, proveedor_id } = req.body;
  const client = await pool.connect();
  try {
    const result = await client.query('INSERT INTO ingredientes (nombre, unidad, precio, proveedor, proveedor_id) VALUES ($1, $2, $3, $4, $5) RETURNING *', [nombre, unidad, precio, proveedor, proveedor_id]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while inserting data into the database' });
  } finally {
    client.release();
  }
});

app.put('/api/ingredientes/individual/estatusupdate/:store', async (req, res) => {
  const { ingredientId, newStatus } = req.body;
  const store = req.params.store;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Update the ingredient based on the store
    let query;
    if (store === 'moral') {
      query = 'UPDATE ingredientes SET estatus_moral = $1 WHERE id_ingrediente = $2';
    } else if (store === 'bosques') {
      query = 'UPDATE ingredientes SET estatus_bosques = $1 WHERE id_ingrediente = $2';
    } else {
      throw new Error('Invalid store');
    }
    await client.query(query, [newStatus, ingredientId]);

    await client.query('COMMIT');

    res.json({ message: 'Successfully updated ingredient status' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'An error occurred while updating data in the database' });
  } finally {
    client.release();
  }
});

app.put('/api/ingredientes/estatusupdate/:store', async (req, res) => {
  const { ingredientIds } = req.body;
  const newStatus = "No Comprado";
  const store = req.params.store;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Update each ingredient based on the store
    let query;
    if (store === 'moral') {
      query = 'UPDATE ingredientes SET estatus_moral = $1 WHERE id_ingrediente = $2';
    } else if (store === 'bosques') {
      query = 'UPDATE ingredientes SET estatus_bosques = $1 WHERE id_ingrediente = $2';
    } else {
      throw new Error('Invalid store');
    }

    for (const id of ingredientIds) {
      await client.query(query, [newStatus, id]);
    }

    await client.query('COMMIT');

    res.json({ message: 'Successfully updated ingredient status' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'An error occurred while updating data in the database' });
  } finally {
    client.release();
  }
});

app.put('/api/ingredientes/resetestatus/:store', async (req, res) => {
  const newStatus = "Suficiente producto";
  const store = req.params.store;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Update all ingredients based on the store
    let query;
    if (store === 'moral') {
      query = 'UPDATE ingredientes SET estatus_moral = $1';
    } else if (store === 'bosques') {
      query = 'UPDATE ingredientes SET estatus_bosques = $1';
    } else {
      throw new Error('Invalid store');
    }

    await client.query(query, [newStatus]);

    await client.query('COMMIT');

    res.json({ message: 'Successfully reset ingredient status' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'An error occurred while updating data in the database' });
  } finally {
    client.release();
  }
});

app.put('/api/ingredientes/:id', async (req, res) => {
  const { nombre, unidad, precio, proveedor, proveedor_id, store_route_order, producto_clave, moral_demanda_semanal, bosques_demanda_semanal, orden_inventario, frecuencias_inventario } = req.body;
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const updateIngredientesQuery = 'UPDATE ingredientes SET nombre = $1, unidad = $2, precio = $3, proveedor = $4, proveedor_id = $5, store_route_order = $7, producto_clave = $8, moral_demanda_semanal = $9, bosques_demanda_semanal = $10, orden_inventario=$11 WHERE id_ingrediente = $6 RETURNING *';
    const result = await client.query(updateIngredientesQuery, [nombre, unidad, precio, proveedor, proveedor_id, id, store_route_order, producto_clave, moral_demanda_semanal, bosques_demanda_semanal, orden_inventario]);

    if (frecuencias_inventario) { // Check if frecuencias_inventario is not null
      const deleteFrecuenciasQuery = 'DELETE FROM ingredientes_frecuencia WHERE id_ingrediente = $1';
      await client.query(deleteFrecuenciasQuery, [id]);

      const insertFrecuenciasQuery = 'INSERT INTO ingredientes_frecuencia (id_ingrediente, frecuencia_inventario_id) VALUES ($1, $2)';
      for (let frecuencia of frecuencias_inventario) {
        if (frecuencia) { // Check if frecuencia is not null
          await client.query(insertFrecuenciasQuery, [id, frecuencia]);
        }
      }
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'An error occurred while updating data in the database' });
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

    // Delete all but the latest submission for the current date
    await client.query(`
      WITH ranked_submissions AS (
        SELECT id, 
               ROW_NUMBER() OVER(PARTITION BY DATE(timestamp) ORDER BY timestamp DESC) as rn
        FROM submissions
        WHERE store = $1 AND DATE(timestamp) = DATE($2)
      )
      DELETE FROM submissions
      WHERE id IN (
        SELECT id FROM ranked_submissions WHERE rn > 1
      )
    `, [store, timestamp]);

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

app.get('/api/pronosticodemanda', async (req, res) => {
  const client = await pool.connect();
  try {
    // Select all rows from pronosticodemanda table
    const result = await client.query('SELECT * FROM pronosticodemanda');

    // Send the result rows as the response
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching data from the database' });
  } finally {
    client.release();
  }
});

app.post('/api/guardarpronosticodemanda', async (req, res) => {
  const { dataplatillos, dataingredientes, nombre } = req.body;
  const client = await pool.connect();
  try {
    // Convert dataplatillos and dataingredientes to JSON string
    const platillos = JSON.stringify(dataplatillos);
    const ingredientes = JSON.stringify(dataingredientes);

    // Insert into pronosticodemanda table
    const result = await client.query('INSERT INTO pronosticodemanda (nombre, dataplatillos, dataingredientes) VALUES ($1, $2, $3) RETURNING *', [nombre, platillos, ingredientes]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while inserting data into the database' });
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
  const { articulosComprados, totalImporte, fecha, folio, emisor } = req.body;

  // Start a transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insert the purchase order
    const orderResult = await client.query(
      'INSERT INTO purchase_orders (fecha, totalImporte, folio, emisor) VALUES ($1, $2, $3, $4) RETURNING id',
      [fecha, totalImporte, folio, emisor]
    );
    const orderId = orderResult.rows[0].id;

    // Insert the purchased items
    for (const item of articulosComprados) {
      await client.query(
        'INSERT INTO purchase_history_items (purchase_order_id, id_ingrediente, quantity, price_per_item, total_price) VALUES ($1, $2, $3, $4, $5)',
        [orderId, item.id_ingrediente, item.quantity, item.price, item.totalPrice]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Purchase order created successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
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
        ingredientes.id_ingrediente;
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
        console.log(`Skipping item with clave ${item.clavepos} for store ${store} within date range ${startDate} to ${endDate}`);
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
          id_ingrediente,
          unidad,
          nombre,
          ROUND(SUM(consumo_platillos)::numeric, 2) AS consumo_platillos,
          ROUND(SUM(consumo_subplatillos)::numeric, 2) AS consumo_subplatillos,
          ROUND((SUM(consumo_platillos) + SUM(consumo_subplatillos))::numeric, 2) AS total_consumido
      FROM 
          (
              SELECT 
                  pi.id_ingrediente AS id_ingrediente,
                  i.unidad AS unidad,
                  i.nombre AS nombre,
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
                          vl.startdate >= $1 AND vl.enddate <= $2 AND vl.store = $3
                      GROUP BY
                          vd.clavepos
                  ) vd
              INNER JOIN 
                  platillos p ON vd.clavepos = p.clavepos
              INNER JOIN 
                  platillos_ingredientes pi ON p.id_platillo = pi.id_platillo
              INNER JOIN 
                  ingredientes i ON pi.id_ingrediente = i.id_ingrediente
              GROUP BY pi.id_ingrediente, i.unidad, i.nombre
              UNION ALL
              SELECT 
                  spi.id_ingrediente AS id_ingrediente,
                  i.unidad AS unidad,
                  i.nombre AS nombre,
                  0 AS consumo_platillos,
                  SUM(vd.cantidad * spi.cantidad / sp.rendimiento) AS consumo_subplatillos
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
                          vl.startdate >= $1 AND vl.enddate <= $2 AND vl.store = $3
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
              GROUP BY spi.id_ingrediente, i.unidad, i.nombre
          ) t
      GROUP BY id_ingrediente, unidad, nombre;
    `, [startDate, endDate, store]);

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
  console.log(`Server is running on port ${port}`);
});
// app.listen(3000, () => console.log('Server listening on port 3000'));