// Required modules
const fs = require('fs');
const path = require('path'); 
const express = require('express');
const multer = require('multer');

// Express app
const app = express();

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/')
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)) // append the original file extension
  }
});

// Middleware
app.use('/uploads', express.static('uploads')); // Serve static files from the "uploads" directory
app.use(express.static('public')); // Serve static files from the "public" directory
const upload = multer({ storage: storage });

// View engine
app.set('view engine', 'ejs');

// Port
const port = process.env.PORT || 3000;

// Function to censor IP
function censorIp(ip) {
  // Remove the ::ffff: prefix if it exists
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }

  let parts = ip.split('.');
  if (parts.length === 4) {
    parts[2] = parts[3] = 'xxx';
  }
  return parts.join('.');
}

// Routes
app.get('/', (req, res) => {
  let uploadData = [];
  try {
    if (fs.existsSync('uploadData.json')) {
      uploadData = JSON.parse(fs.readFileSync('uploadData.json'));
    } else {
      fs.writeFileSync('uploadData.json', JSON.stringify([]));
    }
  } catch (error) {
    console.error('Error reading or writing uploadData.json:', error);
  }
  res.render('index', { files: uploadData });
});

app.post('/upload', upload.single('file'), (req, res) => {
  const ip = req.ip;
  const uploadTime = new Date();

  // Read existing upload data
  let uploadData = [];
  try {
    uploadData = JSON.parse(fs.readFileSync('uploadData.json'));
  } catch (error) {
    console.error('Error reading uploadData.json:', error);
  }

  // Add new upload data
  uploadData.push({
    fileName: req.file.filename,
    uploaderIP: censorIp(ip),
    uploadTime: uploadTime
  });

  // Write updated upload data back to file
  try {
    fs.writeFileSync('uploadData.json', JSON.stringify(uploadData));
  } catch (error) {
    console.error('Error writing uploadData.json:', error);
  }

  res.redirect('/');
});

// Start server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});