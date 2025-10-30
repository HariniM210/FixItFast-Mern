const express = require("express");
const { body } = require("express-validator");
const { authenticateToken } = require("../middleware/auth");
const { register, login, getMe, logout } = require("../controllers/authController");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Dashboard = require("../models/Dashboard");
const passport = require('../config/passport'); // ✅ Import configured passport

const router = express.Router();

// Validation middlewares
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().isLength({ min: 1 })
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
];

// Regular auth routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', authenticateToken, getMe);
router.post('/logout', logout);

// Password reset routes
const { forgotPassword, verifyResetToken, resetPassword } = require('../controllers/authController');
router.post('/forgot-password', forgotPassword);
router.get('/reset-password/verify', verifyResetToken);
router.post('/reset-password', resetPassword);

// ============================================
// ✅ GOOGLE OAUTH ROUTES
// ============================================

// ✅ Initiate Google OAuth (redirect to Google)
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account' // ✅ Force account selection
  })
);

// ✅ Google OAuth callback (handles redirect from Google)
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: 'http://localhost:5173/signin?error=google_auth_failed',
    session: false // ✅ We use JWT, not sessions
  }),
  async (req, res) => {
    try {
      console.log('✅ Google callback: User authenticated');
      
      const user = req.user;
      if (!user) {
        console.error('❌ No user found after Google auth');
        return res.redirect('http://localhost:5173/signin?error=no_user');
      }

      // ✅ Generate JWT token
      const token = jwt.sign(
        { 
          userId: user._id, 
          email: user.email,
          role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      console.log(`🎟️  JWT token generated for ${user.email}`);

      // ✅ Redirect to frontend with token in URL
      // Frontend will extract token and store it
      res.redirect(`http://localhost:5173/auth/callback?token=${token}`);
    } catch (error) {
      console.error('❌ Error in Google callback:', error);
      res.redirect('http://localhost:5173/signin?error=server_error');
    }
  }
);

// ✅ Alternative: Direct token verification (for @react-oauth/google)
// This endpoint accepts Google's credential JWT from frontend
router.post('/google/verify', async (req, res) => {
  try {
    const { credential } = req.body; // Google's JWT credential

    if (!credential) {
      return res.status(400).json({ 
        success: false, 
        message: 'Google credential token is required' 
      });
    }

    // ✅ Verify Google token
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    console.log('✅ Google token verified:', payload.email);

    // ✅ Extract user info from Google payload
    const { sub: googleId, email, name, picture } = payload;

    // ✅ Find or create user
    let user = await User.findOne({ email });

    if (user) {
      console.log(`✅ Existing user: ${user.name}`);
      // Update Google ID and profile picture if not set
      if (!user.googleId) {
        user.googleId = googleId;
        user.profilePicture = picture;
        await user.save();
      }
    } else {
      console.log('🆕 Creating new user from Google OAuth');
      user = await User.create({
        name,
        email,
        googleId,
        profilePicture: picture,
        password: Math.random().toString(36).slice(-8), // Random password
        role: 'user',
        isVerified: true, // Google users are verified
      });
    }

    // ✅ Generate our JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    console.log(`🎟️  JWT issued for: ${user.email}`);

    // ✅ Return token and user data
    res.json({
      success: true,
      message: 'Google authentication successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error('❌ Google token verification failed:', error.message);
    res.status(401).json({ 
      success: false, 
      message: 'Invalid Google token',
      error: error.message 
    });
  }
});

module.exports = router;
