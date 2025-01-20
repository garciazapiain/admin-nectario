const express = require('express');
const { connectDb } = require('./db');
const router = express.Router();

router.get('/', async (req, res) => {
    const client = await connectDb();
    try {
        const result = await client.query('SELECT * FROM subplatillos');
        res.json(result.rows);
    } finally {
        client.release();
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const client = await connectDb();
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

router.post('/', async (req, res) => {
    const { nombre, unidad, rendimiento } = req.body;
    const client = await connectDb();
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

router.post('/:idSubPlatillo/ingredientes', async (req, res) => {
    const client = await connectDb();
    const { idSubPlatillo } = req.params;
    const { id_ingrediente, cantidad } = req.body;

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
})

router.put('/:id/toggleRecetaBloqueada', async (req, res) => {
    const client = await connectDb();
    const { id } = req.params;

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
})

router.put('/:id', async (req, res) => {
    const { nombre, rendimiento } = req.body; // Destructure both fields from the request body
    const { id } = req.params; // Get the id from the route parameters
    const client = await connectDb();

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

router.put('/:idSubPlatillo/ingredientes/:idIngrediente', async (req, res) => {
    const { idSubPlatillo, idIngrediente } = req.params; // Extract route parameters
    const { cantidad } = req.body; // Extract the quantity from the request body
    const client = await connectDb(); // Connect to the database

    try {
        const result = await client.query(
            'UPDATE subplatillos_ingredientes SET cantidad = $1 WHERE id_subplatillo = $2 AND id_ingrediente = $3 RETURNING *',
            [cantidad, idSubPlatillo, idIngrediente]
        );

        if (result.rows.length > 0) {
            res.json(result.rows[0]); // Return the updated record
        } else {
            res.status(404).json({ error: 'Resource not found' }); // Handle case where no rows are updated
        }
    } catch (error) {
        console.error('Error updating subplatillo ingredient:', error.message);
        res.status(500).json({ error: 'An error occurred while updating data in the database' });
    } finally {
        client.release(); // Ensure the database connection is released
    }
});

router.delete('/:idSubPlatillo/ingredientes/:idIngrediente', async (req, res) => {
    const { idSubPlatillo, idIngrediente } = req.params; // Extract route parameters
    const client = await connectDb(); // Connect to the database

    try {
        const result = await client.query(
            'DELETE FROM subplatillos_ingredientes WHERE id_subplatillo = $1 AND id_ingrediente = $2 RETURNING *',
            [idSubPlatillo, idIngrediente]
        );

        if (result.rows.length > 0) {
            res.json({
                message: 'Ingredient deleted successfully',
                data: result.rows[0], // Include deleted record in the response
            });
        } else {
            res.status(404).json({ error: 'Resource not found' }); // Handle case where no matching record is found
        }
    } catch (error) {
        console.error('Error deleting subplatillo ingredient:', error.message);
        res.status(500).json({ error: 'An error occurred while deleting data in the database' }); // Handle database errors
    } finally {
        client.release(); // Ensure the database connection is released
    }
});

module.exports = router;