const express = require('express');
const { connectDb } = require('./db');
const router = express.Router();

router.get('/', async (req, res, next) => {
    const client = await connectDb();
    try {
        const result = await client.query('SELECT * FROM platillos');
        res.json(result.rows);
    } catch (err) {
        next(err);
    } finally {
        client.release();
    }
});

router.post('/', async (req, res, next) => {
    const { nombre, clavepos } = req.body;
    const client = await connectDb();
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

router.get('/check-clave-pos', async (req, res) => {
    const { clavepos } = req.query;

    if (!clavepos) {
        return res.status(400).json({ error: 'Missing clavepos parameter' });
    }

    const client = await connectDb();

    try {
        const result = await client.query('SELECT * FROM platillos WHERE clavepos = $1', [clavepos]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error checking clavepos:', error.message);
        res.status(500).json({ error: 'An error occurred while checking the clavepos' });
    } finally {
        client.release();
    }
});

router.put('/:idPlatillo/clavepos', async (req, res) => {
    const { idPlatillo } = req.params;
    const { clavepos } = req.body;
    const client = await connectDb();

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

        // Update the clavepos for the specified platillo
        const result = await client.query(
            'UPDATE platillos SET clavepos = $1 WHERE id_platillo = $2 RETURNING *',
            [clavepos, idPlatillo]
        );

        if (result.rows.length > 0) {
            res.json(result.rows[0]); // Return the updated platillo
        } else {
            res.status(404).json({ error: 'Platillo not found' });
        }
    } catch (error) {
        console.error('Error updating clavepos:', error.message);
        res.status(500).json({ error: 'An error occurred while updating data in the database' });
    } finally {
        client.release(); // Release the database connection
    }
});

router.get('/:id', async (req, res, next) => {
    const { id } = req.params;
    const client = await connectDb();

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

router.get('/:id', async (req, res, next) => {
    const { id } = req.params;
    const client = await connectDb();

    try {
        // Fetch the platillo
        const result = await client.query('SELECT *, unidades_vendidas FROM platillos WHERE id_platillo = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Platillo not found' });
        }

        // Query for ingredients and subplatillos
        const ingredientsQuery = `
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
                   ps.cantidad as subplatillo_cantidad,
                   true as is_part_of_subplatillo
            FROM ingredientes i
            INNER JOIN subplatillos_ingredientes si ON i.id_ingrediente = si.id_ingrediente
            INNER JOIN platillos_subplatillos ps ON si.id_subplatillo = ps.id_subplatillo
            INNER JOIN subplatillos s ON s.id_subplatillo = ps.id_subplatillo
            WHERE ps.id_platillo = $1
        `;
        const ingredientsResult = await client.query(ingredientsQuery, [id]);

        // Combine the platillo with its ingredients
        const platillo = result.rows[0];
        platillo.ingredients = ingredientsResult.rows;

        res.json(platillo);
    } catch (err) {
        next(err);
    } finally {
        client.release();
    }
});

router.put('/:id/toggleRecetaBloqueada', async (req, res, next) => {
    const { id } = req.params;
    const client = await connectDb();

    try {
        // Retrieve the current receta_bloqueada state
        const currentStateResult = await client.query(
            'SELECT receta_bloqueada FROM platillos WHERE id_platillo = $1',
            [id]
        );

        if (currentStateResult.rowCount === 0) {
            return res.status(404).json({ error: 'Platillo not found' });
        }

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
        next(err);
    } finally {
        client.release();
    }
});

router.put('/:id/cambiarnombre', async (req, res, next) => {
    const { nombre } = req.body;
    const { id } = req.params;
    const client = await connectDb();

    try {
        const result = await client.query(
            'UPDATE platillos SET nombre = $1 WHERE id_platillo = $2 RETURNING nombre',
            [nombre, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Platillo not found' });
        }

        res.json({ nombre: result.rows[0].nombre });
    } catch (err) {
        next(err);
    } finally {
        client.release();
    }
});

router.put('/:id_platillo/precio', async (req, res, next) => {
    const { id_platillo } = req.params;
    const { precio_piso } = req.body;
    const client = await connectDb();

    try {
        await client.query('UPDATE platillos SET precio_piso = $1 WHERE id_platillo = $2', [precio_piso, id_platillo]);
        res.json({ message: 'Precio updated successfully' });
    } catch (error) {
        console.error('Error updating precio:', error.message);
        next(error); // Pass the error to middleware for consistent error handling
    } finally {
        client.release();
    }
});

router.post('/:id/duplicate', async (req, res, next) => {
    const { id } = req.params;
    const client = await connectDb();

    try {
        await client.query('BEGIN');

        // Step 1: Duplicate the platillo
        const sqlQuery1 = `
            WITH max_id AS (
                SELECT MAX(id_platillo) + 1 AS new_id
                FROM platillos
            )
            INSERT INTO platillos (id_platillo, nombre, created_at, updated_at, unidades_vendidas, clavepos)
            SELECT new_id, nombre || ' COPIA', created_at, updated_at, unidades_vendidas, clavepos
            FROM platillos, max_id
            WHERE id_platillo = $1
            RETURNING id_platillo
        `;
        const { rows } = await client.query(sqlQuery1, [id]);
        const newId = rows[0].id_platillo;

        // Step 2: Duplicate the platillos_ingredientes
        const sqlQuery2 = `
            INSERT INTO platillos_ingredientes (id_platillo, id_ingrediente, cantidad)
            SELECT $1, id_ingrediente, cantidad
            FROM platillos_ingredientes
            WHERE id_platillo = $2
        `;
        await client.query(sqlQuery2, [newId, id]);

        // Step 3: Duplicate the platillos_subplatillos
        const sqlQuery3 = `
            INSERT INTO platillos_subplatillos (id_platillo, id_subplatillo, cantidad)
            SELECT $1, id_subplatillo, cantidad
            FROM platillos_subplatillos
            WHERE id_platillo = $2
        `;
        await client.query(sqlQuery3, [newId, id]);

        await client.query('COMMIT');
        client.release();

        res.json({ message: 'Platillo duplicated successfully', newId });
    } catch (error) {
        if (client) {
            await client.query('ROLLBACK');
            client.release();
        }
        console.error(error);
        next(error);
    }
});

// add ingredient to a dish
router.post('/:idPlatillo/ingredientes', async (req, res) => {
    const { idPlatillo } = req.params; // Extract the `idPlatillo` parameter
    const { id_ingrediente, cantidad } = req.body; // Extract `id_ingrediente` and `cantidad` from the request body
    const client = await connectDb(); // Connect to the database

    try {
        const result = await client.query(
            'INSERT INTO platillos_ingredientes (id_platillo, id_ingrediente, cantidad) VALUES ($1, $2, $3) RETURNING *',
            [idPlatillo, id_ingrediente, cantidad]
        );

        res.json(result.rows[0]); // Return the newly inserted record
    } catch (error) {
        console.error('Error inserting ingrediente:', error.message);
        res.status(500).json({ error: 'An error occurred while inserting data into the database' });
    } finally {
        client.release(); // Release the database connection
    }
});

// edit ingredient quantity in a dish
router.put('/:idPlatillo/ingredientes/:idIngrediente', async (req, res) => {
    console.log('hey fucker')
    const { idPlatillo, idIngrediente } = req.params; // Extract route parameters
    const { cantidad } = req.body; // Extract the quantity from the request body
    const client = await connectDb(); // Connect to the database

    try {
        const result = await client.query(
            'UPDATE platillos_ingredientes SET cantidad = $1 WHERE id_platillo = $2 AND id_ingrediente = $3 RETURNING *',
            [cantidad, idPlatillo, idIngrediente]
        );

        if (result.rows.length > 0) {
            res.json(result.rows[0]); // Return the updated record
        } else {
            res.status(404).json({ error: 'Resource not found' });
        }
    } catch (error) {
        console.error('Error updating ingrediente:', error.message);
        res.status(500).json({ error: 'An error occurred while updating data in the database' });
    } finally {
        client.release(); // Release the database client
    }
});

// remove ingredient from a dish
router.delete('/:idPlatillo/ingredientes/:idIngrediente', async (req, res) => {
    console.log('DELETION2');
    const { idPlatillo, idIngrediente } = req.params;
    const client = await connectDb();

    try {
        if (idIngrediente.startsWith('sub_')) {
            // Handle as a subplatillo
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
            // Handle as an ingredient
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
        console.error('Error deleting data:', error.message);
        res.status(500).json({ error: 'An error occurred while deleting data from the database' });
    } finally {
        client.release();
    }
});

// add subdish to a dish
router.post('/:idPlatillo/subplatillos', async (req, res) => {
    console.log('SUB ADDED2');
    const { idPlatillo } = req.params;
    const { id_subplatillo, cantidad } = req.body;
    const client = await connectDb();

    try {
        const result = await client.query(
            'INSERT INTO platillos_subplatillos (id_platillo, id_subplatillo, cantidad) VALUES ($1, $2, $3) RETURNING *',
            [idPlatillo, id_subplatillo, cantidad]
        );

        res.json(result.rows[0]); // Return the newly inserted subplatillo
    } catch (error) {
        console.error('Error adding subplatillo:', error.message);
        res.status(500).json({ error: 'An error occurred while inserting data into the database' });
    } finally {
        client.release(); // Release the database connection
    }
});

router.put('/:idPlatillo/update-with-excel-import', async (req, res, next) => {
    const { idPlatillo } = req.params;
    const { nombre, clavepos, precio_piso } = req.body;
    const client = await connectDb();

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
        console.error('Error updating platillo:', error.message);
        next(error); // Pass the error to the middleware
    } finally {
        client.release();
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params; // Extract platillo ID from the route parameter
    const client = await connectDb(); // Get a database client

    try {
        await client.query('BEGIN'); // Start a transaction

        // Delete related records in `platillos_subplatillos`
        await client.query('DELETE FROM platillos_subplatillos WHERE id_platillo = $1', [id]);

        // Delete the main `platillos` record
        const result = await client.query('DELETE FROM platillos WHERE id_platillo = $1 RETURNING *', [id]);

        await client.query('COMMIT'); // Commit the transaction

        if (result.rowCount === 0) {
            res.status(404).json({ message: 'Platillo not found' });
        } else {
            res.json({ message: 'Platillo deleted successfully', platillo: result.rows[0] });
        }
    } catch (error) {
        await client.query('ROLLBACK'); // Roll back the transaction in case of an error
        console.error('Error deleting platillo:', error);
        res.status(500).json({ error: 'An error occurred while deleting the platillo' });
    } finally {
        client.release(); // Release the database client
    }
});

module.exports = router;
