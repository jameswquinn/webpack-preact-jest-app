const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const inputDir = path.join(__dirname, '../public/images');
const outputDir = path.join(__dirname, '../src/assets/images');

async function optimizeImages() {
  try {
    const files = await fs.readdir(inputDir);
    
    for (const file of files) {
      if (path.extname(file).toLowerCase() === '.png') {
        const inputPath = path.join(inputDir, file);
        const image = sharp(inputPath);
        const metadata = await image.metadata();
        
        // Generate WebP
        await image
          .webp({ quality: 80 })
          .toFile(path.join(outputDir, 'webp', `${path.basename(file, '.png')}.webp`));
        
        // Generate PNG or JPEG based on alpha channel
        if (metadata.channels === 4) {
          await image
            .png({ quality: 100 })
            .toFile(path.join(outputDir, 'png', file));
        } else {
          await image
            .jpeg({ quality: 85 })
            .toFile(path.join(outputDir, 'jpeg
