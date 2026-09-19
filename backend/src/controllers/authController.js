import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'resqnet_jwt_secret', {
    expiresIn: '30d',
  });
};

// @desc    Register a new Help Provider
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, phone, location, organization } = req.body;

    if (!name || !name.trim() || !email || !email.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, email, and password.',
      });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match. Please re-enter your password.',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Security Guarantee: Public registration strictly creates RESOURCE_PROVIDER accounts.
    // Client-supplied role overrides (e.g. ADMIN or COORDINATOR) are strictly ignored and prevented.
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'RESOURCE_PROVIDER',
      phone: (phone || '').trim(),
      location: (location || '').trim(),
      organization: (organization || '').trim(),
      badgeVerified: false,
      isActive: true,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Help Provider account registered successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        location: user.location,
        organization: user.organization,
        badgeVerified: user.badgeVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token (Common login for all roles)
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !email.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter both email and password.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact an administrator.',
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        location: user.location,
        organization: user.organization,
        badgeVerified: user.badgeVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = req.user;
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        location: user.location,
        organization: user.organization,
        badgeVerified: user.badgeVerified,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    One-click demo persona login for instant evaluation
// @route   POST /api/auth/demo-login
// @access  Public
export const demoLogin = async (req, res, next) => {
  try {
    const { persona, role: explicitRole } = req.body; // supports { persona: 'coordinator' } or { role: 'coordinator' }
    const role = (persona === 'coordinator' || explicitRole === 'coordinator') ? 'coordinator' : 'citizen';

    const email = role === 'coordinator' ? 'coordinator@resqnet.org' : 'citizen@resqnet.org';
    const name = role === 'coordinator' ? 'Cmdr. Sarah Jenkins' : 'Alex Rivera';
    const org = role === 'coordinator' ? 'Metropolitan Emergency Relief Command' : 'Community Volunteer';

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        password: 'password123',
        role,
        phone: '+1 (555) 019-2834',
        organization: org,
        badgeVerified: role === 'coordinator',
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: `Switched to ${role.toUpperCase()} demo persona`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        organization: user.organization,
        badgeVerified: user.badgeVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};
