const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Use dynamic import for pdfjs-dist (ESM)
async function main() {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

  const dir = path.join(__dirname, 'doc atpsor');
  const outDir = path.join(__dirname, 'pdf_images');

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf')).sort();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(dir, file);
    console.log(`Processing ${i+1}/${files.length}: ${file}`);

    try {
      const data = new Uint8Array(fs.readFileSync(filePath));
      const doc = await pdfjsLib.getDocument({ data }).promise;
      const page = await doc.getPage(1);

      const scale = 2.0; // Higher resolution
      const viewport = page.getViewport({ scale });

      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');

      // White background
      context.fillStyle = 'white';
      context.fillRect(0, 0, viewport.width, viewport.height);

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      const outFile = path.join(outDir, `pdf_${String(i+1).padStart(2,'0')}.png`);
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(outFile, buffer);
      console.log(`  Saved: ${outFile} (${viewport.width}x${viewport.height})`);

      // Also try to extract any text
      const textContent = await page.getTextContent();
      const text = textContent.items.map(item => item.str).join(' ').trim();
      if (text) {
        console.log(`  Text found: ${text.substring(0, 200)}`);
      } else {
        console.log(`  No text layer (scanned image)`);
      }

    } catch(e) {
      console.log(`  ERROR: ${e.message}`);
    }
  }

  console.log('\nDone!');
}

main().catch(console.error);
