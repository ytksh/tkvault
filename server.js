/**
 * This is a server configuration file for an Express application.
 * It includes configurations for file uploads using Multer, rate limiting using express-rate-limit, 
 * and some utility functions.
 */

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { generatePassword } = require('./scripts/utils');

const app = express();
const PORT = 3000;

// Middleware
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.set('trust proxy', 1);

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

// Rate limiter
const uploadLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 1, // limit each IP to 1 request per windowMs
  message: 'Too many uploads from this IP, please try again after 2 minutes'
});

// Utility function to censor part of an IP address
function censorIp(ip) {
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }

  const parts = ip.split('.');
  if (parts.length === 4) {
    parts[2] = parts[3] = 'xxx';
  }
  return parts.join('.');
}

// Routes

// Home route
app.get('/', (req, res) => {
  let uploadData = [];
  try {
    uploadData = fs.existsSync('uploadData.json') ? JSON.parse(fs.readFileSync('uploadData.json')) : [];
  } catch (error) {
    console.error('Error reading or writing uploadData.json:', error);
  }
  res.render('index', { files: uploadData });
});

// Upload route
app.post('/upload', uploadLimiter, upload.single('file'), async (req, res) => {
  const clientIp = req.headers['x-forwarded-for'] || req.ip;
  const uploadTime = new Date();
  const password = generatePassword(8);

  let uploadData = [];
  try {
    uploadData = fs.existsSync('uploadData.json') ? JSON.parse(fs.readFileSync('uploadData.json')) : [];
  } catch (error) {
    console.error('Error reading uploadData.json:', error);
  }

  const newUpload = {
    fileName: req.file.filename,
    uploaderIP: censorIp(clientIp),
    uploadTime,
    fileSize: req.file.size,
    password
  };

  console.log(`--NEW UPLOAD-- User IP: ${clientIp}\n Data: ${uploadTime}\nFilename: ${newUpload.fileName}\nPassword: ${password}`);
  uploadData.push(newUpload);

  try {
    fs.writeFileSync('uploadData.json', JSON.stringify(uploadData));
  } catch (error) {
    console.error('Error writing uploadData.json:', error);
  }

  res.json({ password });
});

// Delete route
app.delete('/delete/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  const password = req.body.password;

  let uploadData = [];
  try {
    uploadData = JSON.parse(fs.readFileSync('uploadData.json'));
  } catch (error) {
    console.error('Error reading uploadData.json:', error);
  }

  const fileIndex = uploadData.findIndex(file => file.fileName === fileName);
  if (fileIndex === -1) {
    return res.status(404).json({ error: 'File not found' });
  }

  if (uploadData[fileIndex].password !== password) {
    return res.status(403).json({ error: 'Incorrect password' });
  }

  fs.unlinkSync(path.join('uploads', fileName));
  uploadData.splice(fileIndex, 1);

  try {
    fs.writeFileSync('uploadData.json', JSON.stringify(uploadData));
  } catch (error) {
    console.error('Error writing uploadData.json:', error);
  }

  res.json({ message: 'File deleted' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
