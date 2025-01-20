const express = require('express');
const { connectDb } = require('./db');
const router = express.Router();

router.get('/', async (req, res) => {
    const client = await connectDb();
    try {
        const result = await client.query('SELECT * FROM proveedores');
        res.json(result.rows);
    } catch (err) {
        console.error('Error retrieving providers:', err.message);
        res.status(500).json({ error: 'An error occurred while retrieving data from the database' });
    } finally {
        client.release();
    }
});

module.exports = router;