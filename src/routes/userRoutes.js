const express = require('express');
const {
  getUserProfile,
  updateUserProfile,
  getMyEvents,
  getMyRegistrations,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);
router.get('/my-events', protect, getMyEvents);
router.get('/my-registrations', protect, getMyRegistrations);

module.exports = router;