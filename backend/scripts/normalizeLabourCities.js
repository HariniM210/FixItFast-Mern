// backend/scripts/normalizeLabourCities.js
// Usage: node scripts/normalizeLabourCities.js
// Trims surrounding whitespace from Labour.city and standardizes empty values to ""

require('dotenv').config();
const mongoose = require('mongoose');
const Labour = require('../src/models/Labour');

(async () => {
  try {
    const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/fixitfast';
    await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || undefined });
    console.log('Connected to MongoDB');

    const cursor = Labour.find({}, 'city').cursor();
    let scanned = 0;
    let updated = 0;

    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      scanned++;
      const oldCity = doc.city;
      const newCity = typeof oldCity === 'string' ? oldCity.trim() : '';
      if (oldCity !== newCity) {
        await Labour.updateOne({ _id: doc._id }, { $set: { city: newCity } });
        updated++;
      }
    }

    console.log(`Normalize complete. Scanned: ${scanned}, Updated: ${updated}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    console.error('Normalization failed:', e);
    process.exit(1);
  }
})();
