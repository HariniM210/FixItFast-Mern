// backend/server.js
// ✅ Fixed CommonJS Version for Express + MongoDB + Vercel

const express = require('express');
const { ObjectId } = require('mongodb');
const { connectToMongoDB, db, client } = require('./src/db');
const requireDB = require('./src/middleware/requireDB');

const app = express();
const PORT = process.env.PORT || 5000;
const COLLECTION_NAME = 'profiles';

app.use(express.json());

// ✅ Create new profile
app.post('/api/profiles', requireDB, async (req, res) => {
  try {
    const profileData = req.body;
    const collection = db.collection(COLLECTION_NAME);
    const result = await collection.insertOne({
      ...profileData,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      profileVersion: 1,
    });

    console.log(`✅ New profile created: ${profileData.fullName} (${profileData.email})`);
    res.json({
      success: true,
      message: 'Profile created successfully',
      profileId: result.insertedId,
    });
  } catch (error) {
    console.error('Error creating profile:', error);
    res.status(500).json({ success: false, message: 'Error creating profile', error: error.message });
  }
});

// ✅ Update existing profile
app.put('/api/profiles', requireDB, async (req, res) => {
  try {
    const profileData = req.body;
    const { _id, ...updateData } = profileData;
    const collection = db.collection(COLLECTION_NAME);

    if (!_id) return res.status(400).json({ success: false, message: 'Profile ID required' });
    if (!ObjectId.isValid(_id)) return res.status(400).json({ success: false, message: 'Invalid ID format' });

    const existing = await collection.findOne({ _id: new ObjectId(_id) });
    if (!existing) return res.status(404).json({ success: false, message: 'Profile not found' });

    const updated = {
      ...updateData,
      lastUpdated: new Date().toISOString(),
      profileVersion: (existing.profileVersion || 1) + 1,
    };

    await collection.updateOne({ _id: new ObjectId(_id) }, { $set: updated });

    res.json({ success: true, message: 'Profile updated', profile: updated });
    console.log(`✅ Profile updated: ${updated.fullName} (${updated.email})`);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: 'Error updating profile', error: error.message });
  }
});

// ✅ Delete profile
app.delete('/api/profiles/:id', requireDB, async (req, res) => {
  try {
    const { id } = req.params;
    const collection = db.collection(COLLECTION_NAME);
    if (!ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid ID format' });

    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return res.status(404).json({ success: false, message: 'Profile not found' });

    res.json({ success: true, message: 'Profile deleted' });
    console.log(`❌ Profile deleted: ${id}`);
  } catch (error) {
    console.error('Error deleting profile:', error);
    res.status(500).json({ success: false, message: 'Error deleting profile', error: error.message });
  }
});

// ✅ Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    database: db ? 'connected' : 'disconnected',
  });
});

// ✅ Start server
async function startServer() {
  try {
    await connectToMongoDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
