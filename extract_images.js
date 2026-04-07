const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'doc atpsor');
const outDir = path.join(__dirname, 'pdf_images');

const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf')).sort();

// Scanned PDFs contain embedded JPEG images
// JPEG starts with FF D8 FF and ends with FF D9
function extractJpegFromPdf(buffer) {
  const images = [];
  let i = 0;
  while (i < buffer.length - 2) {
    // Look for JPEG start marker FF D8 FF
    if (buffer[i] === 0xFF && buffer[i+1] === 0xD8 && buffer[i+2] === 0xFF) {
      const start = i;
      // Find JPEG end marker FF D9
      let j = i + 3;
      while (j < buffer.length - 1) {
        if (buffer[j] === 0xFF && buffer[j+1] === 0xD9) {
          images.push(buffer.slice(start, j + 2));
          i = j + 2;
          break;
        }
        j++;
      }
      if (j >= buffer.length - 1) break;
    } else {
      i++;
    }
  }
  return images;
}

for (let fi = 0; fi < files.length; fi++) {
  const file = files[fi];
  const filePath = path.join(dir, file);
  const buffer = fs.readFileSync(filePath);

  console.log(`=== ${fi+1}. ${file} (${buffer.length} bytes) ===`);

  const images = extractJpegFromPdf(buffer);
  console.log(`  Found ${images.length} JPEG image(s)`);

  if (images.length > 0) {
    // Save the first (largest) image - likely the page scan
    // Sort by size descending, take the biggest one
    images.sort((a, b) => b.length - a.length);
    const outFile = path.join(outDir, `pdf_${String(fi+1).padStart(2,'0')}.jpg`);
    fs.writeFileSync(outFile, images[0]);
    console.log(`  Saved largest image: ${outFile} (${images[0].length} bytes)`);

    // If there are more images, note their sizes
    if (images.length > 1) {
      for (let k = 1; k < images.length; k++) {
        console.log(`  Additional image ${k+1}: ${images[k].length} bytes`);
      }
    }
  }
  console.log('');
}

console.log('Done! Images saved to pdf_images/');
