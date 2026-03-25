const express = require('express');
const router = express.Router();
const priceController = require('../controllers/priceController.js');

router.post('/track-price', priceController.trackPrice);
router.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

module.exports = router;