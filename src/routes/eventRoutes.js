const express = require('express');
const {
  getEvents,
  searchEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  unregisterFromEvent,
  getEventAttendees,
} = require('../controllers/eventController');
const { protect, organizer } = require('../middleware/auth');

const router = express.Router();

router.route('/').get(getEvents).post(protect, organizer, createEvent);
router.get('/search', searchEvents);
router.route('/:id').get(getEventById).put(protect, updateEvent).delete(protect, deleteEvent);
router.post('/:id/register', protect, registerForEvent);
router.post('/:id/unregister', protect, unregisterFromEvent);
router.get('/:id/attendees', protect, getEventAttendees);

module.exports = router;