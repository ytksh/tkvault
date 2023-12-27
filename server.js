const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Serve static files from the "public" directory
app.use(express.static("public"));

app.use(express.json()); // Parse incoming JSON requests

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Set up multer with limits (maxSize in bytes)
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 12, // 12 MB
  },
});

// Serve HTML form for file upload
app.get('/', (req, res) => {
  const files = fs.readdirSync('public/uploads/');
  res.render('index', { files });
});

// Handle file upload
app.post('/upload', upload.single('file'), (req, res) => {
  res.redirect('/');
});

// Serve uploaded files from the "public/uploads" directory
app.use('/uploads', express.static('public/uploads'));

// Endpoint to get the list of files
app.get('/getFiles', (req, res) => {
  try {
    const files = fs.readdirSync('public/uploads/');
    res.json({ files });
  } catch (error) {
    console.error('Error reading files:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
