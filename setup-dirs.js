import fs from 'fs';
import path from 'path';

// Create directories
const basePath = 'src';
const pagesDir = path.join(basePath, 'pages');
const stylesDir = path.join(basePath, 'styles');
const componentsDir = path.join(basePath, 'components');

if (!fs.existsSync(pagesDir)) {
  fs.mkdirSync(pagesDir, { recursive: true });
  console.log(`Created ${pagesDir}`);
}

if (!fs.existsSync(stylesDir)) {
  fs.mkdirSync(stylesDir, { recursive: true });
  console.log(`Created ${stylesDir}`);
}

if (!fs.existsSync(componentsDir)) {
  fs.mkdirSync(componentsDir, { recursive: true });
  console.log(`Created ${componentsDir}`);
}

console.log('Directories ready for React components');
