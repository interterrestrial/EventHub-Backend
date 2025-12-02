const prisma = require('../config/db');

// Get all events with filtering, sorting, pagination
const getEvents = async (req, res) => {
  try {
    const {
      category,
      status,
      registrationStatus,
      search,
      sortBy = 'date',
      sortOrder = 'asc',
      page = 1,
      limit = 10,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (registrationStatus) where.registrationStatus = registrationStatus;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { venue: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build orderBy clause
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          organizer: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { registrations: true },
          },
        },
      }),
      prisma.event.count({ where }),
    ]);

    res.json({
      events,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching events' });
  }
};

// Search events
const searchEvents = async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({ message: 'Search keyword is required' });
    }

    const events = await prisma.event.findMany({
      where: {
        OR: [
          { title: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } },
          { venue: { contains: keyword, mode: 'insensitive' } },
        ],
      },
      include: {
        organizer: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { registrations: true },
        },
      },
    });

    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error searching events' });
  }
};

// Get single event
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        _count: {
          select: { registrations: true },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching event' });
  }
};

// Create event
const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      venue,
      date,
      time,
      registrationDeadline,
      maxAttendees,
      imageUrl,
    } = req.body;

    if (!title || !description || !category || !venue || !date || !time || !registrationDeadline) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        category,
        venue,
        date: new Date(date),
        time,
        registrationDeadline: new Date(registrationDeadline),
        maxAttendees: maxAttendees ? parseInt(maxAttendees) : null,
        imageUrl: imageUrl || null,
        organizerId: req.user.id,
      },
      include: {
        organizer: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(201).json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating event' });
  }
};

// Update event
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await prisma.event.findUnique({ where: { id } });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check authorization
    if (event.organizerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this event' });
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        ...req.body,
        date: req.body.date ? new Date(req.body.date) : event.date,
        registrationDeadline: req.body.registrationDeadline
          ? new Date(req.body.registrationDeadline)
          : event.registrationDeadline,
      },
      include: {
        organizer: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.json(updatedEvent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating event' });
  }
};

// Delete event
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await prisma.event.findUnique({ where: { id } });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check authorization
    if (event.organizerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }

    await prisma.event.delete({ where: { id } });
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting event' });
  }
};

// Register for event
const registerForEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await prisma.event.findUnique({
      where: { id },
      include: { _count: { select: { registrations: true } } },
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.registrationStatus === 'closed') {
      return res.status(400).json({ message: 'Registration is closed for this event' });
    }

    if (event.maxAttendees && event._count.registrations >= event.maxAttendees) {
      return res.status(400).json({ message: 'Event is full' });
    }

    // Check if already registered
    const existingRegistration = await prisma.registration.findUnique({
      where: {
        userId_eventId: {
          userId: req.user.id,
          eventId: id,
        },
      },
    });

    if (existingRegistration) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    const registration = await prisma.registration.create({
      data: {
        userId: req.user.id,
        eventId: id,
      },
      include: {
        event: true,
      },
    });

    res.status(201).json({ message: 'Successfully registered for event', registration });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error registering for event' });
  }
};

// Unregister from event
const unregisterFromEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const registration = await prisma.registration.findUnique({
      where: {
        userId_eventId: {
          userId: req.user.id,
          eventId: id,
        },
      },
    });

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    await prisma.registration.delete({
      where: {
        userId_eventId: {
          userId: req.user.id,
          eventId: id,
        },
      },
    });

    res.json({ message: 'Successfully unregistered from event' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error unregistering from event' });
  }
};

// Get event attendees
const getEventAttendees = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await prisma.event.findUnique({ where: { id } });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check authorization
    if (event.organizerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view attendees' });
    }

    const attendees = await prisma.registration.findMany({
      where: { eventId: id },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, college: true, department: true },
        },
      },
      orderBy: { registeredAt: 'desc' },
    });

    res.json(attendees);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching attendees' });
  }
};

module.exports = {
  getEvents,
  searchEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  unregisterFromEvent,
  getEventAttendees,
};