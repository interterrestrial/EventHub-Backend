const prisma = require('../config/db');

// Get organizer dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const organizerId = req.user.id;

    const [totalEvents, totalRegistrations, upcomingEvents, completedEvents, events] = await Promise.all([
      prisma.event.count({ where: { organizerId } }),
      prisma.registration.count({
        where: { event: { organizerId } },
      }),
      prisma.event.count({ where: { organizerId, status: 'upcoming' } }),
      prisma.event.count({ where: { organizerId, status: 'completed' } }),
      prisma.event.findMany({
        where: { organizerId },
        include: {
          _count: {
            select: { registrations: true },
          },
        },
        orderBy: { registrations: { _count: 'desc' } },
        take: 5,
      }),
    ]);

    const popularEvents = events.map((event) => ({
      id: event.id,
      title: event.title,
      category: event.category,
      registrations: event._count.registrations,
    }));

    res.json({
      totalEvents,
      totalRegistrations,
      upcomingEvents,
      completedEvents,
      popularEvents,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching dashboard statistics' });
  }
};

module.exports = { getDashboardStats };