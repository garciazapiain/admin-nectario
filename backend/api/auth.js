const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const isProduction = process.env.NODE_ENV === 'production';
const pool = new Pool({
    connectionString: isProduction ? process.env.DATABASE_URL : 'postgresql://juangarciazapiain:123@localhost:5432/inventarios',
    ssl: isProduction ? { rejectUnauthorized: false } : false,
  });

router.post('/register', async (req, res) => {
  const client = await pool.connect();
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    await client.query('INSERT INTO users (name, password) VALUES ($1, $2)', [req.body.name, hashedPassword]);
    res.status(201).send('User registered');
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred during registration.');
  } finally {
    client.release();
  }
});

router.post('/login', async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, password } = req.body;
    if (!name || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const result = await client.query('SELECT * FROM users WHERE name = $1', [name]);
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ error: 'User not found.' });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(403).json({ error: 'Invalid password.' });
    }

    const accessToken = jwt.sign({ name: user.name, isAdmin: user.isAdmin }, process.env.ACCESS_TOKEN_SECRET);
    res.json({ accessToken, isAdmin: user.isAdmin });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  } finally {
    client.release();
  }
});

module.exports = router;