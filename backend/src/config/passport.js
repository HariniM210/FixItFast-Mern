// backend/src/config/passport.js
// ✅ Google OAuth Configuration using Passport.js

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// ✅ Serialize user to session (store user ID in session)
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// ✅ Deserialize user from session (retrieve user by ID)
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// ✅ Google OAuth Strategy Configuration
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        console.log('🔍 Google OAuth: Processing user profile...');
        
        // Extract user info from Google profile
        const email = profile.emails[0].value;
        const googleId = profile.id;
        const name = profile.displayName;
        const profilePicture = profile.photos[0]?.value || '';

        console.log(`📧 Google user email: ${email}`);

        // ✅ Check if user already exists by email
        let user = await User.findOne({ email });

        if (user) {
          // ✅ User exists - update Google ID if not set
          console.log(`✅ Existing user found: ${user.name}`);
          if (!user.googleId) {
            user.googleId = googleId;
            user.profilePicture = profilePicture;
            await user.save();
            console.log('🔗 Linked Google account to existing user');
          }
        } else {
          // ✅ Create new user with Google info
          console.log('🆕 Creating new user from Google OAuth...');
          user = await User.create({
            name,
            email,
            googleId,
            profilePicture,
            password: Math.random().toString(36).slice(-8), // Random password (not used for OAuth)
            role: 'user',
            isVerified: true, // Google users are pre-verified
          });
          console.log(`✅ New user created: ${user.name} (${user.email})`);
        }

        return done(null, user);
      } catch (error) {
        console.error('❌ Google OAuth error:', error.message);
        return done(error, null);
      }
    }
  )
);

module.exports = passport;
