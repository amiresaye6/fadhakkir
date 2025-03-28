// In your main script or run file
const { uploadReels } = require('./server');
require("dotenv").config();

uploadReels()
  .then(() => console.log('Reel upload process completed'))
  .catch(error => console.error('Reel upload failed', error));
