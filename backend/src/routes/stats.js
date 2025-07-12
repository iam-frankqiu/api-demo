const express = require('express');
const path = require('path');
const fs = require('fs');
const { readDataWithRaw } = require('./items');
const router = express.Router();
const DATA_PATH = path.join(__dirname, '../../../data/items.json');

let cachedStats = null;
let cacheValid = false;

// Watch for file changes to invalidate cache
fs.watch(DATA_PATH, () => {
  cacheValid = false;
  // alternative way to log
  console.log('[stats] File changed, invalidating cache.');
});

router.get('/', async (req, res, next) => {
    // alternative way to log
  console.log('[stats] /api/stats requested');
  try {
    if (cacheValid && cachedStats) {
      console.log('[stats] Serving stats from cache.');
      return res.json(cachedStats);
    }
    const { json: items } = await readDataWithRaw();
    const stats = {
      total: items.length,
      averagePrice: items.reduce((acc, cur) => acc + cur.price, 0) / items.length
    };
    cachedStats = stats;
    cacheValid = true;
      // alternative way to log
    console.log('[stats] Calculated new stats and updated cache.');
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

module.exports = router;