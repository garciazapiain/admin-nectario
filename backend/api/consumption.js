const express = require('express');
const { connectDb } = require('./db');
const router = express.Router();

router.post('/cargarventas', async (req, res) => {
    const { store, startDate, endDate, items } = req.body;
    const client = await connectDb();
    try {
        // Insert into VentasLog table
        const salesLogResult = await client.query(
            'INSERT INTO VentasLog (store, startDate, endDate) VALUES ($1, $2, $3) RETURNING *',
            [store, startDate, endDate]
        );

        // Get the id of the inserted sales log
        const ventasLogId = salesLogResult.rows[0].id;

        // Insert each item into the SalesData table
        for (const item of items) {
            const existingRecord = await client.query(
                `SELECT * 
                 FROM VentasData 
                 INNER JOIN VentasLog ON VentasData.ventasLogId = VentasLog.id 
                 WHERE VentasLog.store = $1 AND VentasLog.startDate <= $2 AND VentasLog.endDate >= $3 AND VentasData.clavepos = $4`,
                [store, endDate, startDate, item.clavepos]
            );

            if (existingRecord.rows.length > 0) {
                continue; // Skip this item
            }

            await client.query(
                'INSERT INTO VentasData (ventasLogId, clavepos, descripcion, cantidad) VALUES ($1, $2, $3, $4)',
                [ventasLogId, item.clavepos, item.descripcion, item.cantidad]
            );
        }

        res.json({ message: 'Data successfully inserted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while inserting data into the database' });
    } finally {
        client.release();
    }
});

router.get('/:store', async (req, res) => {
    const { store } = req.params;
    const { startDate, endDate } = req.query;
    const client = await connectDb();

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

module.exports = router;