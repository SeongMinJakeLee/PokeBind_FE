const fs = require('fs');
const path = require('path');

// Create directories
const basePath = 'src';
const pagesDir = path.join(basePath, 'pages');
const stylesDir = path.join(basePath, 'styles');

if (!fs.existsSync(pagesDir)) {
  fs.mkdirSync(pagesDir, { recursive: true });
  console.log(`Created ${pagesDir}`);
}

if (!fs.existsSync(stylesDir)) {
  fs.mkdirSync(stylesDir, { recursive: true });
  console.log(`Created ${stylesDir}`);
}

console.log('Directories ready for React components');
