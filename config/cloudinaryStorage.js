const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const cloudinary = require('./cloudinary');

// Multer storage for Profile Pictures
const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'profiles',
    public_id: (req, file) => `profile_${req.userId}`, // Unique ID for each user
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }] // Auto-crop on face
  }
});

// Multer storage for Chat Images
const chatStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'chats',
    resource_type: 'image',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [{ width: 800, quality: 'auto' }] // Optimize for performance
  }
});

// Multer storage for Story Images (with expiration)
const storyStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'stories',
    resource_type: 'image',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [{ width: 1080, height: 1920, crop: 'fill' }], // Adjust for stories
    tags: ['story'], // Add tag for easy deletion later
    // metadata: { expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() } // Add metadata for expiration
  }
});

const uploadProfile = multer({ storage: profileStorage });
const uploadChat = multer({ storage: chatStorage });
const uploadStory = multer({ storage: storyStorage });

module.exports = { uploadProfile, uploadChat, uploadStory };
