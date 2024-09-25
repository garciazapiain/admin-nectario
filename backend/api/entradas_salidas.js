const express = require('express');
const { connectDb } = require('./db');
const router = express.Router();

// GET request with date range filtering
router.get('/compras', async (req, res) => {
    const { startDate, endDate } = req.query;
    const client = await connectDb();

    try {
        const query = `
            SELECT es.*, i.nombre, i.unidad 
            FROM entradas_salidas_compras es
            JOIN ingredientes i ON es.id_ingrediente = i.id_ingrediente
            WHERE es.fecha_inicio >= $1 AND es.fecha_fin <= $2
        `;
        const result = await client.query(query, [startDate, endDate]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching data from entradas_salidas_compras:', error);
        res.status(500).json({ error: 'Error fetching data' });
    } finally {
        client.release();
    }
});

// PUT request to handle "Entrada" or "Salida" movements
router.put('/movimiento/transfers', async (req, res) => {
    const { id_ingrediente, origen, destino, cantidad, startDate, endDate } = req.body;

    const client = await connectDb();

    try {
        await client.query('BEGIN');

        // Fetch current quantities for the given ingrediente and date range
        const currentData = await client.query(
            'SELECT quantity_cedis, quantity_moral, quantity_campestre, total_quantity FROM entradas_salidas_compras WHERE id_ingrediente = $1 AND fecha_inicio = $2 AND fecha_fin = $3',
            [id_ingrediente,startDate, endDate]
        );

        if (currentData.rows.length === 0) {
            return res.status(404).json({ error: 'Ingrediente not found for the given date range' });
        }

        // Get the current quantities for each location
        const { quantity_cedis, quantity_moral, quantity_campestre, total_quantity } = currentData.rows[0];

        // Convert everything to numbers for safe math operations
        let updatedCedis = parseFloat(quantity_cedis);
        let updatedMoral = parseFloat(quantity_moral);
        let updatedCampestre = parseFloat(quantity_campestre);
        let totalQuantity = parseFloat(total_quantity);
        const movementCantidad = parseFloat(cantidad);

        // Subtract from 'origen'
        if (origen === 'CEDIS') {
            updatedCedis -= movementCantidad;
        } else if (origen === 'Moral') {
            updatedMoral -= movementCantidad;
        } else if (origen === 'Campestre') {
            updatedCampestre -= movementCantidad;
        }

        // Add to 'destino'
        if (destino === 'CEDIS') {
            updatedCedis += movementCantidad;
        } else if (destino === 'Moral') {
            updatedMoral += movementCantidad;
        } else if (destino === 'Campestre') {
            updatedCampestre += movementCantidad;
        }

        // Calculate the sum of all locations
        const sumOfLocations = updatedCedis + updatedMoral + updatedCampestre;
        // Ensure the sum of locations matches the total quantity
        if (sumOfLocations !== totalQuantity) {
            return res.status(400).json({ error: 'Sum of quantities does not match total_quantity' });
        }

        // Update the database with the new quantities
        await client.query(
            'UPDATE entradas_salidas_compras SET quantity_cedis = $1, quantity_moral = $2, quantity_campestre = $3 WHERE id_ingrediente = $4 AND fecha_inicio = $5 AND fecha_fin = $6',
            [updatedCedis, updatedMoral, updatedCampestre, id_ingrediente, startDate, endDate]
        );

        await client.query('COMMIT');
        res.json({ message: 'Movimiento updated successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    } finally {
        client.release();
    }
});



module.exports = router;
