const express = require('express');
const upload = require('../../utils/upload'); // Cloudinary configuration
const { connectDb } = require('../db');

const router = express.Router();

// POST an image and update the ingredientes table
router.post('/upload', upload.single('image'), async (req, res) => {
  const { id_ingrediente, image_type } = req.body;
  const imageUrl = req.file.path;

  if (!id_ingrediente || !image_type) {
    return res.status(400).json({ error: 'Missing id_ingrediente or image_type' });
  }

  const client = await connectDb();
  try {
    const columnToUpdate = image_type === 'image_url_2' ? 'image_url_2' : 'image_url'; // Default to image_url
    const query = `
      UPDATE ingredientes
      SET ${columnToUpdate} = $1
      WHERE id_ingrediente = $2
      RETURNING *;
    `;
    const values = [imageUrl, id_ingrediente];
    const result = await client.query(query, values);

    res.status(200).json({ [columnToUpdate]: imageUrl, ...result.rows[0] });
  } catch (error) {
    console.error('Error updating ingredient image URL:', error);
    res.status(500).json({ error: 'Error saving image URL' });
  } finally {
    client.release();
  }
});

module.exports = router;
