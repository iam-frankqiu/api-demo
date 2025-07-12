const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const router = express.Router();
const DATA_PATH = path.join(__dirname, '../../../data/items.json');

// Utility to read data (async) and return both JSON and raw buffer
async function readDataWithRaw() {
  const raw = await fs.readFile(DATA_PATH);
  return { json: JSON.parse(raw), raw };
}

// Utility to read data (async, just JSON)
async function readData() {
  const { json } = await readDataWithRaw();
  return json;
}

// Utility to compute hash for ETag
function computeHash(buffer) {
  return crypto.createHash('sha1').update(buffer).digest('hex');
}

// GET /api/items
router.get('/', async (req, res, next) => {
  try {
    const data = await readData();
    const { limit, offset, q } = req.query;
    let results = data;

    if (q) {
      results = results.filter(item => item.name.toLowerCase().includes(q.toLowerCase()));
    }

    const total = results.length;
    const start = offset ? parseInt(offset) : 0;
    const end = limit ? start + parseInt(limit) : undefined;
    const paginated = results.slice(start, end);

    res.json({ items: paginated, total });
  } catch (err) {
    next(err);
  }
});

// GET /api/items/:id
router.get('/:id', async (req, res, next) => {
  try {
    const data = await readData();
    const item = data.find(i => i.id === parseInt(req.params.id));
    if (!item) {
      const err = new Error('Item not found');
      err.status = 404;
      throw err;
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// POST /api/items
router.post('/', async (req, res, next) => {
  try {
    const item = req.body;
    const data = await readData();
    item.id = Date.now();
    data.push(item);
    await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

module.exports = { router, readDataWithRaw, readData, computeHash };