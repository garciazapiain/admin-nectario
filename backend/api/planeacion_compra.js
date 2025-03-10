const express = require('express');
const { connectDb } = require('./db');
const router = express.Router();

// GET all planeacion_compra records
router.get('/', async (req, res) => {
  const client = await connectDb();

  try {
    const query = 'SELECT * FROM planeacion_compra ORDER BY created_at DESC';
    const result = await client.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching data from planeacion_compra:', error);
    res.status(500).json({ error: 'Error fetching data' });
  } finally {
    client.release();
  }
});

// POST a new planeacion_compra record
router.post('/', async (req, res) => {
  const {
    id_ingrediente,
    nombre,
    proveedor,
    surtirMoral,
    surtirCampestre,
    image_url,
    image_url_2,
    moral_demanda_semanal,
    bosques_demanda_semanal,
    proveedor_opcion_b,
    userName
  } = req.body;

  const client = await connectDb();

  try {
    // Step 1: Check if the record already exists
    const checkQuery = `SELECT * FROM planeacion_compra WHERE id_ingrediente = $1;`;
    const checkResult = await client.query(checkQuery, [id_ingrediente]);

    if (checkResult.rows.length > 0) {
      // Step 2: Explicitly Update Flags
      const updateQuery = `
      UPDATE planeacion_compra
      SET 
        surtir_moral = $1,
        surtir_campestre = $2,
        added_moral = $3::BOOLEAN OR added_moral,
        added_campestre = $4::BOOLEAN OR added_campestre,
        updated_at = NOW()
      WHERE id_ingrediente = $5
      RETURNING *;
      `;

      const values = [
        surtirMoral || existingRecord.surtir_moral,
        surtirCampestre || existingRecord.surtir_campestre,
        userName === "moral",    // This will force added_moral = TRUE
        userName === "campestre",// This will force added_campestre = TRUE
        id_ingrediente
      ];

      const updateResult = await client.query(updateQuery, values);
      return res.status(200).json({ message: "Record updated successfully", row: updateResult.rows[0] });
    }

    // Step 3: Insert New Record
    const insertQuery = `
      INSERT INTO planeacion_compra (
        id_ingrediente, 
        nombre, 
        proveedor, 
        surtir_moral, 
        surtir_campestre, 
        added_moral, 
        added_campestre, 
        image_url, 
        image_url_2, 
        moral_demanda_semanal, 
        bosques_demanda_semanal, 
        proveedor_opcion_b, 
        created_at, 
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING *;
    `;

    const values = [
      id_ingrediente,
      nombre,
      proveedor || "",
      surtirMoral || "",
      surtirCampestre || "",
      userName === "moral",      // Force true for moral
      userName === "campestre",  // Force true for campestre
      image_url || null,
      image_url_2 || null,
      moral_demanda_semanal || 0,
      bosques_demanda_semanal || 0,
      proveedor_opcion_b || ""
    ];

    const insertResult = await client.query(insertQuery, values);
    res.status(201).json({ message: "Record inserted successfully", row: insertResult.rows[0] });
  } catch (error) {
    console.error('Error handling POST in planeacion_compra:', error);
    res.status(500).json({ error: 'Error processing request' });
  } finally {
    client.release();
  }
});

// GET a specific planeacion_compra record by id_ingrediente
router.get('/:id_ingrediente', async (req, res) => {
  const { id_ingrediente } = req.params;
  const client = await connectDb();

  try {
    const query = 'SELECT * FROM planeacion_compra WHERE id_ingrediente = $1';
    const result = await client.query(query, [id_ingrediente]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching planeacion_compra by id_ingrediente:', error);
    res.status(500).json({ error: 'Error fetching data' });
  } finally {
    client.release();
  }
});

// PUT: Toggle ya_comprado
router.put('/:id_ingrediente/toggle-comprado', async (req, res) => {
  const { id_ingrediente } = req.params;
  const { ya_comprado } = req.body; // Expect the new value to be sent in the request body

  if (typeof ya_comprado !== 'boolean') {
    return res.status(400).json({ error: 'Field "ya_comprado" must be a boolean' });
  }

  const client = await connectDb();

  try {
    const query = `
      UPDATE planeacion_compra
      SET ya_comprado = $1, updated_at = NOW()
      WHERE id_ingrediente = $2
      RETURNING *;
    `;
    const values = [ya_comprado, id_ingrediente];
    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }

    res.json(result.rows[0]); // Return the updated record
  } catch (error) {
    console.error('Error updating ya_comprado:', error);
    res.status(500).json({ error: 'Error updating data' });
  } finally {
    client.release();
  }
});

router.put('/:id_ingrediente/toggle-entregado', async (req, res) => {
  const { id_ingrediente } = req.params;
  const { ya_entregado_moral, ya_entregado_bosques } = req.body;

  const client = await connectDb();

  try {
    const query = `
      UPDATE planeacion_compra
      SET ya_entregado_moral = COALESCE($1, ya_entregado_moral),
          ya_entregado_bosques = COALESCE($2, ya_entregado_bosques)
      WHERE id_ingrediente = $3
      RETURNING *;
    `;
    const values = [ya_entregado_moral, ya_entregado_bosques, id_ingrediente];
    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating ya_entregado:", error);
    res.status(500).json({ error: "Error updating data" });
  } finally {
    client.release();
  }
});

// PUT to update a specific planeacion_compra record
router.put('/:id_ingrediente', async (req, res) => {
  const { id_ingrediente } = req.params;
  const { nombre, proveedor, surtirMoral, surtirCampestre, userName } = req.body;

  const client = await connectDb();

  try {
    // Fetch existing record to avoid overwriting unrelated fields
    const checkQuery = 'SELECT * FROM planeacion_compra WHERE id_ingrediente = $1';
    const checkResult = await client.query(checkQuery, [id_ingrediente]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Record not found for update" });
    }

    const existingRecord = checkResult.rows[0];

    // Conditional update logic for moral/campestre flags
    const updatedAddedMoral = userName === "moral" ? true : existingRecord.added_moral;
    const updatedAddedCampestre = userName === "campestre" ? true : existingRecord.added_campestre;

    const query = `
      UPDATE planeacion_compra
      SET 
        nombre = $1, 
        proveedor = $2, 
        surtir_moral = COALESCE($3, surtir_moral), 
        surtir_campestre = COALESCE($4, surtir_campestre),
        added_moral = $5,
        added_campestre = $6,
        updated_at = NOW()
      WHERE id_ingrediente = $7
      RETURNING *;
    `;

    const values = [
      nombre || existingRecord.nombre,
      proveedor || existingRecord.proveedor,
      surtirMoral || existingRecord.surtir_moral,
      surtirCampestre || existingRecord.surtir_campestre,
      updatedAddedMoral,
      updatedAddedCampestre,
      id_ingrediente
    ];

    const result = await client.query(query, values);
    res.json({ message: "Record updated successfully", row: result.rows[0] });
  } catch (error) {
    console.error("Error updating planeacion_compra:", error);
    res.status(500).json({ error: "Error updating data" });
  } finally {
    client.release();
  }
});

router.delete('/store', async (req, res) => {
  const client = await connectDb();
  const { userName } = req.body; // Get user type from request
  if (!userName) {
    return res.status(400).json({ error: 'User type (moral/campestre) is required' });
  }

  try {
    let query = '';

    if (userName === 'moral') {
      query = 'UPDATE planeacion_compra SET added_moral = FALSE WHERE added_moral = TRUE';
    } else if (userName === 'campestre') {
      query = 'UPDATE planeacion_compra SET added_campestre = FALSE WHERE added_campestre = TRUE';
    } else {
      return res.status(400).json({ error: 'Invalid user type' });
    }

    await client.query(query);
    res.status(200).json({ message: `Records for ${userName} cleared successfully` });
  } catch (error) {
    console.error('Error updating planeacion_compra records:', error);
    res.status(500).json({ error: 'Error updating records' });
  } finally {
    client.release();
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params; // Ingredient ID
  const { userName } = req.body; // Username (moral or campestre) passed from the frontend

  if (!userName) {
    return res.status(400).json({ error: 'Missing userName in request' });
  }

  const client = await connectDb();

  try {
    // Fetch the ingredient to check current state
    const fetchQuery = `SELECT * FROM planeacion_compra WHERE id_ingrediente = $1`;
    const fetchResult = await client.query(fetchQuery, [id]);

    if (fetchResult.rowCount === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const item = fetchResult.rows[0];

    // Logic based on userName
    if (userName === 'moral' && item.added_campestre) {
      // Update `added_moral` to false if `added_campestre` is true
      const updateQuery = `
        UPDATE planeacion_compra
        SET added_moral = false, updated_at = NOW()
        WHERE id_ingrediente = $1
        RETURNING *;
      `;
      const updateResult = await client.query(updateQuery, [id]);
      return res.status(200).json({ message: 'Updated item for moral', item: updateResult.rows[0] });
    } else if (userName === 'campestre' && item.added_moral) {
      // Update `added_campestre` to false if `added_moral` is true
      const updateQuery = `
        UPDATE planeacion_compra
        SET added_campestre = false, updated_at = NOW()
        WHERE id_ingrediente = $1
        RETURNING *;
      `;
      const updateResult = await client.query(updateQuery, [id]);
      return res.status(200).json({ message: 'Updated item for campestre', item: updateResult.rows[0] });
    } else {
      // If no other store has it marked, delete the record
      const deleteQuery = `DELETE FROM planeacion_compra WHERE id_ingrediente = $1 RETURNING *;`;
      const deleteResult = await client.query(deleteQuery, [id]);
      return res.status(200).json({ message: 'Item successfully deleted', item: deleteResult.rows[0] });
    }
  } catch (error) {
    console.error('Error processing deletion:', error);
    res.status(500).json({ error: 'Error processing deletion' });
  } finally {
    client.release();
  }
});

// DELETE all planeacion_compra records
router.delete('/', async (req, res) => {
  const client = await connectDb();

  try {
    const query = 'DELETE FROM planeacion_compra';
    await client.query(query);
    res.status(200).json({ message: 'All records deleted successfully' });
  } catch (error) {
    console.error('Error deleting all planeacion_compra records:', error);
    res.status(500).json({ error: 'Error deleting records' });
  } finally {
    client.release();
  }
});

module.exports = router;
