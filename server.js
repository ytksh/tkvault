const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit'); 
const { generatePassword } = require('./scripts/utils');

const app = express();
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.set('trust proxy', 1);
const upload = multer({ dest: 'uploads/' });

// Rate limiter
const uploadLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 1, // limit each IP to 1 requests per windowMs
  message: "Too many uploads from this IP, please try again after 2 minutes"
});

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

app.post('/upload', uploadLimiter, upload.single('file'), async (req, res) => {
  let ip = req.headers['x-forwarded-for'] || req.ip;
  ip = ip.split(',')[0];
  const uploadTime = new Date();

  // Generate a random password
  const password = generatePassword(8);

  // Read existing upload data
  let uploadData = [];
  try {
    if (fs.existsSync('uploadData.json')) {
      uploadData = JSON.parse(fs.readFileSync('uploadData.json'));
    }
  } catch (error) {
    console.error('Error reading uploadData.json:', error);
  }

  // Add new upload data
  uploadData.push({
    fileName: req.file.filename,
    uploaderIP: censorIp(ip),
    uploadTime: uploadTime,
    fileSize: req.file.size,
    password: password
  });

  // Write updated upload data back to file
  try {
    fs.writeFileSync('uploadData.json', JSON.stringify(uploadData));
  } catch (error) {
    console.error('Error writing uploadData.json:', error);
  }

  // Send the password to the client
  res.json({ password: password });
});

app.delete('/delete/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  const password = req.body.password;

  // Read existing upload data
  let uploadData = [];
  try {
    uploadData = JSON.parse(fs.readFileSync('uploadData.json'));
  } catch (error) {
    console.error('Error reading uploadData.json:', error);
  }

  // Find the file with the given name
  const fileIndex = uploadData.findIndex(file => file.fileName === fileName);
  if (fileIndex === -1) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Check the password
  if (uploadData[fileIndex].password !== password) {
    return res.status(403).json({ error: 'Incorrect password' });
  }

  // Delete the file
  fs.unlinkSync(path.join('uploads', fileName));

  // Remove the file's data
  uploadData.splice(fileIndex, 1);

  // Write updated upload data back to file
  try {
    fs.writeFileSync('uploadData.json', JSON.stringify(uploadData));
  } catch (error) {
    console.error('Error writing uploadData.json:', error);
  }

  res.json({ message: 'File deleted' });
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});
