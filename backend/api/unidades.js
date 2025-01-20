const express = require('express');
const { connectDb } = require('./db');
const router = express.Router();

router.get('/', async (req, res) => {
    const client = await connectDb();
    try {
        const result = await client.query(`
            SELECT conname, pg_get_constraintdef(pg_constraint.oid)
            FROM pg_constraint
            INNER JOIN pg_class ON conrelid=pg_class.oid
            WHERE pg_class.relname='ingredientes' AND conname='ingredientes_unidad_check'
        `);

        const constraintDef = result.rows[0]?.pg_get_constraintdef || '';
        const unitsMatch = constraintDef.match(/ARRAY\[(.*)\]/);
        const units = unitsMatch ? unitsMatch[1].replace(/'::text/g, '').replace(/'/g, '').split(', ') : [];

        res.json(units);
    } catch (err) {
        console.error('Error retrieving units:', err.message);
        res.status(500).json({ error: 'An error occurred while retrieving data from the database' });
    } finally {
        client.release();
    }
});

module.exports = router;
