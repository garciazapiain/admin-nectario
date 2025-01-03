require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path'); // Add this line
const { Pool } = require('pg');
const authRoutes = require('./api/auth');
const submissionRoutes = require('./api/submissions');
const entradasSalidasRouter = require('./api/entradas_salidas');
const planeacionCompraRouter = require('./api/planeacion_compra');
const ingredientImageUploadRouter = require('./api/ingredient_image');

// const retrieveInbox = require('./api/retrieve_inbox');

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
app.use('/api/entradas_salidas', entradasSalidasRouter);
app.use('/api/planeacion_compra', planeacionCompraRouter);
app.use('/api/ingredient_image', ingredientImageUploadRouter);
// app.use('/api/retrieveinbox', retrieveInbox);

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
  const { nombre, clavepos } = req.body;
  const client = await pool.connect();
  try {
    let result;
    if (clavepos !== undefined) {
      result = await client.query(
        'INSERT INTO platillos (id_platillo, nombre, clavepos) VALUES ((SELECT COALESCE(MAX(id_platillo), 0) + 1 FROM platillos), $1, $2) RETURNING *',
        [nombre, clavepos]
      );
    } else {
      result = await client.query(
        'INSERT INTO platillos (id_platillo, nombre) VALUES ((SELECT COALESCE(MAX(id_platillo), 0) + 1 FROM platillos), $1) RETURNING *',
        [nombre]
      );
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while inserting data into the database' });
  } finally {
    client.release();
  }
});

// Toggle recetaBloqueada state
app.put('/api/platillos/:id/toggleRecetaBloqueada', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    // Retrieve the current receta_bloqueada state
    const currentStateResult = await client.query(
      'SELECT receta_bloqueada FROM platillos WHERE id_platillo = $1',
      [id]
    );

    const currentState = currentStateResult.rows[0].receta_bloqueada;

    // Toggle the state
    const newState = !currentState;

    // Update the receta_bloqueada state in the database
    const result = await client.query(
      'UPDATE platillos SET receta_bloqueada = $1 WHERE id_platillo = $2 RETURNING receta_bloqueada',
      [newState, id]
    );

    res.json({ receta_bloqueada: result.rows[0].receta_bloqueada });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while toggling the receta_bloqueada state.' });
  } finally {
    client.release();
  }
});

app.put('/api/platillos/:id/cambiarnombre', async (req, res) => {
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
  let client;

  try {
    const client = await pool.connect();
    await client.query('BEGIN');

    const sqlQuery1 = `
      WITH max_id AS (
        SELECT MAX(id_platillo) + 1 AS new_id
        FROM platillos
      )
      INSERT INTO platillos (id_platillo, nombre, created_at, updated_at, unidades_vendidas, clavepos)
      SELECT new_id, nombre || ' COPIA', created_at, updated_at, unidades_vendidas, clavepos
      FROM platillos, max_id
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
    if (client) {
      await client.query('ROLLBACK');
      client.release();
    }
    console.error(error);
    res.status(500).json({ error: 'An error occurred while duplicating the platillo' });
  }
});

app.get('/api/platillo/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT *, unidades_vendidas FROM platillos WHERE id_platillo = $1', [id]);
    let ingredientsQuery;
    // If not including subplatillos, only get direct ingredients
    ingredientsQuery = `
        SELECT i.nombre, 
               i.id_ingrediente::text, 
               i.unidad, 
               pi.cantidad, 
               i.precio, 
               NULL as rendimiento, 
               false as is_subplatillo, 
               NULL as subplatillo_cantidad,
               false as is_part_of_subplatillo
        FROM ingredientes i
        INNER JOIN platillos_ingredientes pi ON i.id_ingrediente = pi.id_ingrediente
        WHERE pi.id_platillo = $1
        
        UNION
        
        -- Subplatillos directly associated with the platillo
        SELECT s.nombre, 
               'sub_' || s.id_subplatillo::text, 
               s.unidad, 
               ps.cantidad, 
               NULL as precio,
               s.rendimiento, 
               true as is_subplatillo, 
               ps.cantidad as subplatillo_cantidad,
               false as is_part_of_subplatillo
        FROM subplatillos s
        INNER JOIN platillos_subplatillos ps ON s.id_subplatillo = ps.id_subplatillo
        WHERE ps.id_platillo = $1
        
        UNION
        
        -- Ingredients that are part of subplatillos
        SELECT i.nombre, 
               i.id_ingrediente::text, 
               i.unidad, 
               si.cantidad, 
               i.precio,
               s.rendimiento, 
               false as is_subplatillo, 
               ps.cantidad as subplatillo_cantidad,  -- Adjusted to correctly reflect the subplatillo quantity in platillo
               true as is_part_of_subplatillo
        FROM ingredientes i
        INNER JOIN subplatillos_ingredientes si ON i.id_ingrediente = si.id_ingrediente
        INNER JOIN platillos_subplatillos ps ON si.id_subplatillo = ps.id_subplatillo
        INNER JOIN subplatillos s ON s.id_subplatillo = ps.id_subplatillo
        WHERE ps.id_platillo = $1
      `
    const ingredientsResult = await client.query(ingredientsQuery, [id]);
    const platillo = result.rows[0];
    platillo.ingredients = ingredientsResult.rows;
    res.json(platillo);
  } finally {
    client.release();
  }
});


// Add this new route to check if a clavepos already exists
app.get('/api/platillos/check', async (req, res) => {
  const { clavepos } = req.query;
  const client = await pool.connect();

  try {
    const result = await client.query('SELECT * FROM platillos WHERE clavepos = $1', [clavepos]);
    res.json(result.rows);  // Return the list of matching platillos
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while checking the clavepos' });
  } finally {
    client.release();
  }
});


app.delete('/api/platillo/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN'); // Start a transaction

    // Delete dependent records first
    await client.query('DELETE FROM platillos_subplatillos WHERE id_platillo = $1', [id]);

    // Now delete the platillo record
    const result = await client.query('DELETE FROM platillos WHERE id_platillo = $1 RETURNING *', [id]);

    await client.query('COMMIT'); // Commit the transaction

    if (result.rowCount === 0) {
      res.status(404).json({ message: 'Platillo not found' });
    } else {
      res.json({ message: 'Platillo deleted successfully', platillo: result.rows[0] });
    }
  } catch (error) {
    await client.query('ROLLBACK'); // Roll back in case of an error
    console.error('Error deleting platillo:', error);
    res.status(500).json({ error: 'An error occurred while deleting the platillo' });
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
    if (idIngrediente.startsWith('sub_')) {
      // If the idIngrediente starts with "sub_", handle it as a subplatillo
      const subplatilloId = idIngrediente.replace('sub_', ''); // Remove the "sub_" prefix

      const result = await client.query(
        'DELETE FROM platillos_subplatillos WHERE id_platillo = $1 AND id_subplatillo = $2 RETURNING *',
        [idPlatillo, subplatilloId]
      );

      if (result.rows.length > 0) {
        res.json({ message: 'Subplatillo deleted successfully' });
      } else {
        res.status(404).json({ error: 'Subplatillo not found' });
      }
    } else {
      // Otherwise, handle it as an ingredient
      const result = await client.query(
        'DELETE FROM platillos_ingredientes WHERE id_platillo = $1 AND id_ingrediente = $2 RETURNING *',
        [idPlatillo, idIngrediente]
      );

      if (result.rows.length > 0) {
        res.json({ message: 'Ingredient deleted successfully' });
      } else {
        res.status(404).json({ error: 'Ingredient not found' });
      }
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

app.put('/api/platillos/:idPlatillo/clavepos', async (req, res) => {
  const { idPlatillo } = req.params;
  const { clavepos } = req.body;
  const client = await pool.connect();

  try {
    // Check if clavepos already exists for a different platillo
    const checkResult = await client.query(
      'SELECT * FROM platillos WHERE clavepos = $1 AND id_platillo != $2',
      [clavepos, idPlatillo]
    );

    if (checkResult.rows.length > 0) {
      res.status(400).json({ error: 'Clavepos already exists for another platillo' });
      return; // Exit if duplicate clavepos is found
    }

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

// Add this new route to handle updating the entire platillo
app.put('/api/platillos/:idPlatillo', async (req, res) => {
  const { idPlatillo } = req.params;
  const { nombre, clavepos, precio_piso } = req.body;
  const client = await pool.connect();

  try {
    // Check if clavepos already exists for a different platillo
    const checkResult = await client.query(
      'SELECT * FROM platillos WHERE clavepos = $1 AND id_platillo != $2',
      [clavepos, idPlatillo]
    );

    if (checkResult.rows.length > 0) {
      res.status(400).json({ error: 'Clavepos already exists for another platillo' });
      return; // Exit if duplicate clavepos is found
    }

    const result = await client.query(
      'UPDATE platillos SET nombre = $1, clavepos = $2, precio_piso = $3 WHERE id_platillo = $4 RETURNING *',
      [nombre, clavepos, precio_piso, idPlatillo]
    );

    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Platillo not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while updating the platillo in the database' });
  } finally {
    client.release();
  }
});

app.put('/api/platillos/:id_platillo/precio', async (req, res) => {
  const { id_platillo } = req.params;
  const { precio_piso } = req.body;
  const client = await pool.connect();
  try {
    await client.query('UPDATE platillos SET precio_piso = $1 WHERE id_platillo = $2', [precio_piso, id_platillo]);
    res.json({ message: 'Precio updated successfully' });
  } catch (error) {
    console.error('Error updating precio:', error);
    res.status(500).json({ error: 'Error updating precio' });
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

app.put('/api/subplatillos/:idSubPlatillo/ingredientes/:idIngrediente', async (req, res) => {
  const { idSubPlatillo, idIngrediente } = req.params;
  const { cantidad } = req.body;
  const client = await pool.connect();

  try {
    const result = await client.query(
      'UPDATE subplatillos_ingredientes SET cantidad = $1 WHERE id_subplatillo = $2 AND id_ingrediente = $3 RETURNING *',
      [cantidad, idSubPlatillo, idIngrediente]
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

// Toggle recetaBloqueada state
app.put('/api/subplatillos/:id/toggleRecetaBloqueada', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    // Retrieve the current receta_bloqueada state
    const currentStateResult = await client.query(
      'SELECT receta_bloqueada FROM subplatillos WHERE id_subplatillo = $1',
      [id]
    );

    const currentState = currentStateResult.rows[0].receta_bloqueada;

    // Toggle the state
    const newState = !currentState;

    // Update the receta_bloqueada state in the database
    const result = await client.query(
      'UPDATE subplatillos SET receta_bloqueada = $1 WHERE id_subplatillo = $2 RETURNING receta_bloqueada',
      [newState, id]
    );

    res.json({ receta_bloqueada: result.rows[0].receta_bloqueada });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while toggling the receta_bloqueada state.' });
  } finally {
    client.release();
  }
});

app.delete('/api/subplatillos/:idSubPlatillo/ingredientes/:idIngrediente', async (req, res) => {
  const { idSubPlatillo, idIngrediente } = req.params;
  const client = await pool.connect();

  try {
    const result = await client.query(
      'DELETE FROM subplatillos_ingredientes WHERE id_subplatillo = $1 AND id_ingrediente = $2 RETURNING *',
      [idSubPlatillo, idIngrediente]
    );

    if (result.rows.length > 0) {
      res.json({ message: 'Ingredient deleted successfully', data: result.rows[0] });
    } else {
      res.status(404).json({ error: 'Resource not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while deleting data in the database' });
  } finally {
    client.release();
  }
});

app.put('/api/subplatillos/:id', async (req, res) => {
  const { nombre, rendimiento } = req.body; // Destructure both fields from the request body
  const { id } = req.params; // Get the id from the route parameters
  const client = await pool.connect();

  try {
    // Construct the dynamic update query based on which fields are provided
    const fieldsToUpdate = [];
    const values = [];
    let queryIndex = 1;

    if (nombre) {
      fieldsToUpdate.push(`nombre = $${queryIndex}`);
      values.push(nombre);
      queryIndex++;
    }

    if (rendimiento) {
      fieldsToUpdate.push(`rendimiento = $${queryIndex}`);
      values.push(rendimiento);
      queryIndex++;
    }

    // Ensure at least one field is being updated
    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ error: 'No fields provided for update' });
    }

    const query = `
      UPDATE subplatillos 
      SET ${fieldsToUpdate.join(', ')} 
      WHERE id_subplatillo = $${queryIndex}
      RETURNING nombre, rendimiento
    `;

    values.push(id); // Add the ID as the last parameter for the WHERE clause

    const result = await client.query(query, values);

    if (result.rows.length > 0) {
      res.json(result.rows[0]); // Return the updated fields
    } else {
      res.status(404).json({ error: 'Subplatillo not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  } finally {
    client.release();
  }
});

app.post('/api/subplatillos', async (req, res) => {
  const { nombre, unidad, rendimiento } = req.body;
  const client = await pool.connect();
  try {
    // Select the maximum id_subplatillo and add 1 to it for the new ID
    const result = await client.query(`
      INSERT INTO subplatillos (id_subplatillo, nombre, unidad, rendimiento)
      VALUES (
        (SELECT COALESCE(MAX(id_subplatillo), 0) + 1 FROM subplatillos), $1, $2, $3
      ) RETURNING *`, [nombre, unidad, rendimiento]);

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

app.get('/api/ingredientes-producto-clave', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT i.*, array_agg(f.nombre) as frecuencias_inventario
      FROM ingredientes i
      LEFT JOIN ingredientes_frecuencia if ON i.id_ingrediente = if.id_ingrediente
      LEFT JOIN frecuencia_inventario f ON if.frecuencia_inventario_id = f.id
      WHERE i.producto_clave = true
      GROUP BY i.id_ingrediente
    `);
    res.json(result.rows);
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

app.put('/api/ingredientes/no-claves-resetestatus/:store', async (req, res) => {
  const newStatus = "Suficiente producto";
  const store = req.params.store;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Update non-key ingredients based on the store, including those where producto_clave is NULL
    let query;
    if (store === 'moral') {
      query = 'UPDATE ingredientes SET estatus_moral = $1 WHERE producto_clave = FALSE OR producto_clave IS NULL';
    } else if (store === 'bosques') {
      query = 'UPDATE ingredientes SET estatus_bosques = $1 WHERE producto_clave = FALSE OR producto_clave IS NULL';
    } else {
      throw new Error('Invalid store');
    }

    await client.query(query, [newStatus]);

    await client.query('COMMIT');

    res.json({ message: 'Successfully reset non-key ingredient status, including those not marked as key' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'An error occurred while updating data in the database' });
  } finally {
    client.release();
  }
});

app.put('/api/ingredientes/:id', async (req, res) => {
  const {
    nombre,
    unidad,
    precio,
    merma, // Added merma here
    proveedor,
    proveedor_id,
    store_route_order,
    producto_clave,
    moral_demanda_semanal,
    bosques_demanda_semanal,
    orden_inventario,
    proveedor_opcion_b
  } = req.body;
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const updateIngredientesQuery = `
      UPDATE ingredientes 
      SET nombre = $1, unidad = $2, precio = $3, merma = $4, proveedor = $5, proveedor_id = $6, store_route_order = $7, producto_clave = $8, moral_demanda_semanal = $9, bosques_demanda_semanal = $10, orden_inventario = $11, proveedor_opcion_b = $12 
      WHERE id_ingrediente = $13 
      RETURNING *`;
    const result = await client.query(updateIngredientesQuery, [
      nombre,
      unidad,
      precio,
      merma, // Included merma here in the parameters
      proveedor,
      proveedor_id,
      store_route_order,
      producto_clave,
      moral_demanda_semanal,
      bosques_demanda_semanal,
      orden_inventario,
      proveedor_opcion_b,
      id // Moved to the last position
    ]);

    // if (frecuencias_inventario) {
    //   // Check if frecuencias_inventario is not null
    //   const deleteFrecuenciasQuery = 'DELETE FROM ingredientes_frecuencia WHERE id_ingrediente = $1';
    //   await client.query(deleteFrecuenciasQuery, [id]);

    //   const insertFrecuenciasQuery = 'INSERT INTO ingredientes_frecuencia (id_ingrediente, frecuencia_inventario_id) VALUES ($1, $2)';
    //   for (let frecuencia of frecuencias_inventario) {
    //     if (frecuencia) {
    //       // Check if frecuencia is not null
    //       await client.query(insertFrecuenciasQuery, [id, frecuencia]);
    //     }
    //   }
    // }

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

app.get('/api/pronosticodemandainsumos', async (req, res) => {
  const client = await pool.connect();
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

// app.post('/api/submissions', async (req, res) => {
//   const { store, timestamp, ingredients } = req.body;
//   const client = await pool.connect();
//   try {
//     // Convert ingredients to JSON string
//     const compra = JSON.stringify(ingredients);

//     // Insert into submissions table
//     const result = await client.query('INSERT INTO submissions (store, timestamp, compra) VALUES ($1, $2, $3) RETURNING *', [store, timestamp, compra]);

//     // Delete all but the latest submission for the current date
//     await client.query(`
//       WITH ranked_submissions AS (
//         SELECT id, 
//                ROW_NUMBER() OVER(PARTITION BY DATE(timestamp) ORDER BY timestamp DESC) as rn
//         FROM submissions
//         WHERE store = $1 AND DATE(timestamp) = DATE($2)
//       )
//       DELETE FROM submissions
//       WHERE id IN (
//         SELECT id FROM ranked_submissions WHERE rn > 1
//       )
//     `, [store, timestamp]);

//     res.json(result.rows[0]);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'An error occurred while inserting data into the database' });
//   } finally {
//     client.release();
//   }
// });

// app.get('/api/submissions', async (req, res) => {
//   const client = await pool.connect();
//   try {
//     // Query the submissions table
//     const result = await client.query('SELECT * FROM submissions');

//     res.json(result.rows);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'An error occurred while retrieving data from the database' });
//   } finally {
//     client.release();
//   }
// });

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


const { exec } = require('child_process');

app.post('/api/test-playwright', (req, res) => {
  const vendor = req.body.vendor;
  let scriptPath = '';

  switch (vendor) {
    case 'heb':
      scriptPath = 'playwright/facturacion/heb.js';
      break;
    case 'costco':
      scriptPath = 'playwright/facturacion/costco.js';
      break;
    default:
      return res.status(400).send('Invalid vendor');
  }

  exec(`node ${scriptPath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return res.status(500).send('Error running Playwright script');
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return res.status(500).send('Script execution error');
    }
    res.send('Playwright script executed successfully');
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

app.listen(port, () => {
});
// app.listen(3000, () => console.log('Server listening on port 3000'));