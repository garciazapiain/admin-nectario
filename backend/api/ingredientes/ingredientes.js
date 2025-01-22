const express = require('express');
const { connectDb } = require('../db'); // Import your database connection utility
const router = express.Router();

router.get('/', async (req, res) => {
    const client = await connectDb();
    try {
        const result = await client.query(`
            SELECT i.*, array_agg(f.nombre) as frecuencias_inventario
            FROM ingredientes i
            LEFT JOIN ingredientes_frecuencia if ON i.id_ingrediente = if.id_ingrediente
            LEFT JOIN frecuencia_inventario f ON if.frecuencia_inventario_id = f.id
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

router.get('/producto-clave', async (req, res) => {
    const client = await connectDb();
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

router.get('/demanda', async (req, res) => {
    const client = await connectDb();
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

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const client = await connectDb();
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

router.post('/', async (req, res) => {
    const { nombre, unidad, precio, proveedor, proveedor_id } = req.body;
    const client = await connectDb();
    try {
        const result = await client.query(`
            INSERT INTO ingredientes (nombre, unidad, precio, proveedor, proveedor_id) 
            VALUES ($1, $2, $3, $4, $5) RETURNING *
        `, [nombre, unidad, precio, proveedor, proveedor_id]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while inserting data into the database' });
    } finally {
        client.release();
    }
});

router.put('/resetestatus/:store', async (req, res) => {
    const newStatus = "Suficiente producto";
    const store = req.params.store;
    const client = await connectDb();
    try {
        await client.query('BEGIN');
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

router.put('/:id', async (req, res) => {
    const {
        nombre,
        unidad,
        precio,
        proveedor,
        proveedor_id,
        proveedor_opcion_b,
        merma,
        store_route_order,
        orden_inventario,
        moral_demanda_semanal,
        bosques_demanda_semanal,
        image_url,
        image_url_2,
        producto_clave
    } = req.body;

    const { id } = req.params;
    const client = await connectDb();
    try {
        const result = await client.query(`
            UPDATE ingredientes 
            SET 
                nombre = $1, 
                unidad = $2, 
                precio = $3, 
                proveedor = $4, 
                proveedor_id = $5, 
                proveedor_opcion_b = $6,
                merma = $7,
                store_route_order = $8,
                orden_inventario = $9,
                moral_demanda_semanal = $10,
                bosques_demanda_semanal = $11,
                image_url = $12,
                image_url_2 = $13,
                producto_clave = $14
            WHERE id_ingrediente = $15 
            RETURNING *
        `, [
            nombre,
            unidad,
            precio,
            proveedor,
            proveedor_id,
            proveedor_opcion_b,
            merma,
            store_route_order,
            orden_inventario,
            moral_demanda_semanal,
            bosques_demanda_semanal,
            image_url,
            image_url_2,
            producto_clave,
            id
        ]);
        res.json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            // Handle unique constraint violation for `nombre`
            res.status(400).json({ error: `Ingredient name '${nombre}' already exists.` });
        } else {
            console.error(err);
            res.status(500).json({ error: 'An error occurred while updating data in the database' });
        }
    } finally {
        client.release();
    }
});

router.put('/no-claves-resetestatus/:store', async (req, res) => {
    const newStatus = "Suficiente producto";
    const store = req.params.store;
    const client = await connectDb();
    try {
        await client.query('BEGIN');
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

module.exports = router;
