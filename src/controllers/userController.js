const prisma = require('../config/db');
const bcrypt = require('bcryptjs');

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        college: true,
        department: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const { name, phone, college, department, password } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (college) updateData.college = college;
    if (department) updateData.department = department;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        college: true,
        department: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating profile' });
  }
};

// Get user's created events (organizer)
const getMyEvents = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { organizerId: req.user.id },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching your events' });
  }
};

// Get user's registrations (student)
const getMyRegistrations = async (req, res) => {
  try {
    const registrations = await prisma.registration.findMany({
      where: { userId: req.user.id },
      include: {
        event: {
          include: {
            organizer: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: { registeredAt: 'desc' },
    });

    res.json(registrations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching your registrations' });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getMyEvents,
  getMyRegistrations,
};