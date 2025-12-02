const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const generateToken = require('../utils/generateToken');

// Register User
const registerUser = async (req, res) => {
  try {
    console.log('=== REGISTRATION REQUEST RECEIVED ===');
    console.log('Body:', req.body);
    
    const { name, email, password, role, phone, college, department } = req.body;

    // Validation
    if (!name || !email || !password) {
      console.log('Missing required fields');
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    console.log('Checking if user exists...');
    // Check if user exists
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      console.log('User already exists');
      return res.status(400).json({ message: 'User already exists' });
    }

    console.log('Hashing password...');
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log('Creating user in database...');
    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'student',
        phone: phone || null,
        college: college || null,
        department: department || null,
      },
    });

    console.log('User created successfully:', user.id);
    
    if (user) {
      res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user.id),
      });
    }
  } catch (error) {
    console.error('=== REGISTRATION ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ 
      message: 'Server error during registration',
      error: error.message 
    });
  }
};

// Login User
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check for user
    const user = await prisma.user.findUnique({ where: { email } });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user.id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Logout User
const logoutUser = async (req, res) => {
  res.json({ message: 'User logged out successfully' });
};

module.exports = { registerUser, loginUser, logoutUser };