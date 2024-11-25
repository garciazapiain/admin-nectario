const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Safely log the configuration to check if it's loaded correctly
console.log("Cloudinary Configuration:");
console.log({
  cloud_name: cloudinary.config().cloud_name,
  api_key: cloudinary.config().api_key,
  // Avoid logging sensitive information like `api_secret`
});

module.exports = cloudinary;
