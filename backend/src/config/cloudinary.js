const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Determine if Cloudinary is configured
const isPlaceholder = (v) => /^your[_-]/i.test(String(v || '').trim());
const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET &&
  ![process.env.CLOUDINARY_CLOUD_NAME, process.env.CLOUDINARY_API_KEY, process.env.CLOUDINARY_API_SECRET].some(isPlaceholder)
);

// Configure Cloudinary when keys exist
if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Multer configuration for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Helper function to upload image
const uploadToCloudinary = (buffer, folder = 'admin-profiles') => {
  if (!isCloudinaryConfigured) {
    // Fallback: save locally under /uploads
    return new Promise((resolve, reject) => {
      try {
        const relFolder = path.posix.join(folder.replace(/\\/g, '/'));
        const uploadsDir = path.join(process.cwd(), 'uploads', relFolder);
        fs.mkdirSync(uploadsDir, { recursive: true });
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
        const filePath = path.join(uploadsDir, filename);
        fs.writeFileSync(filePath, buffer);
        // Build web-accessible URL (served by server.js as /uploads)
        const webUrl = `/uploads/${relFolder}/${filename}`.replace(/\\/g, '/');
        return resolve({
          secure_url: webUrl,
          public_id: filename,
          width: 0,
          height: 0,
          format: 'jpg',
        });
      } catch (e) {
        return reject(e);
      }
    });
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: folder,
          resource_type: 'image',
          transformation: [
            { quality: 'auto' },
            { fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      )
      .end(buffer);
  });
};

// Helper function to delete from Cloudinary or local
const deleteFromCloudinary = (publicId) => {
  if (!isCloudinaryConfigured) {
    // No-op for local files (optional: implement deletion if you store public_id with path)
    return Promise.resolve({ result: 'ok' });
  }
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

module.exports = {
  cloudinary,
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
  isCloudinaryConfigured,
};
