const express = require('express');
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect, organizer } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', protect, organizer, getDashboardStats);

module.exports = router;