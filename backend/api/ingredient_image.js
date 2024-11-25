const express = require('express');
const upload = require('../utils/upload'); // Cloudinary configuration
const { connectDb } = require('./db');

const router = express.Router();

// POST an image and update the ingredientes table
router.post('/upload', upload.single('image'), async (req, res) => {
  const { id_ingrediente } = req.body;
  const imageUrl = req.file.path;

  const client = await connectDb();
  try {
    const query = `
      UPDATE ingredientes
      SET image_url = $1
      WHERE id_ingrediente = $2
      RETURNING *;
    `;
    const values = [imageUrl, id_ingrediente];
    const result = await client.query(query, values);

    res.status(200).json({ image_url: imageUrl, ...result.rows[0] });
  } catch (error) {
    console.error('Error updating ingredient image URL:', error);
    res.status(500).json({ error: 'Error saving image URL' });
  } finally {
    client.release();
  }
});

module.exports = router;
