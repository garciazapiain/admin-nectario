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
  const { id_ingrediente, nombre, proveedor, surtirMoral, surtirCampestre } = req.body;

  const client = await connectDb();

  try {
    const query = `
      INSERT INTO planeacion_compra (id_ingrediente, nombre, proveedor, surtir_moral, surtir_campestre)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [id_ingrediente, nombre, proveedor, surtirMoral, surtirCampestre];
    const result = await client.query(query, values);

    res.status(201).json(result.rows[0]); // Return the created record
  } catch (error) {
    console.error('Error inserting data into planeacion_compra:', error);
    res.status(500).json({ error: 'Error inserting data' });
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
// PUT to update a specific planeacion_compra record
router.put('/:id_ingrediente', async (req, res) => {
    const { id_ingrediente } = req.params;
    const { nombre, proveedor, surtirMoral, surtirCampestre } = req.body;
  
    const client = await connectDb();
  
    try {
      const query = `
        UPDATE planeacion_compra
        SET nombre = $1, proveedor = $2, surtir_moral = $3, surtir_campestre = $4, updated_at = NOW()
        WHERE id_ingrediente = $5
        RETURNING *;
      `;
      const values = [nombre, proveedor, surtirMoral, surtirCampestre, id_ingrediente];
      const result = await client.query(query, values);
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Record not found for update' });
      }
  
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating planeacion_compra:', error);
      res.status(500).json({ error: 'Error updating data' });
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
