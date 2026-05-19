// One-shot photo optimizer for the portrait slot.
// Takes ./profilepic.webp -> tight square crop -> 3 sizes x 3 formats.
// Run with: node optimize-photo.js
//
// Output: public/portrait-{112,224,336}.{avif,webp,jpg}
//
// To adjust the crop region, tweak SQUARE_RATIO (fraction of source height
// used as the square edge) and TOP_PAD_RATIO (top padding as fraction of
// source height).

const sharp = require('sharp');
const { statSync } = require('node:fs');
const { join } = require('node:path');

const INPUT = join(__dirname, 'profilepic.webp');
const OUTDIR = join(__dirname, 'public');

const SIZES = [112, 224, 336];
const SQUARE_RATIO = 0.55;
const TOP_PAD_RATIO = 0.05;

(async () => {
  const meta = await sharp(INPUT).metadata();
  console.log(`source: ${meta.width}x${meta.height} ${meta.format}, ${statSync(INPUT).size.toLocaleString()} bytes`);

  const squareSize = Math.min(meta.width, Math.round(meta.height * SQUARE_RATIO));
  const cropTop = Math.round(meta.height * TOP_PAD_RATIO);
  const cropLeft = Math.max(0, Math.round((meta.width - squareSize) / 2));
  console.log(`crop:   ${squareSize}x${squareSize} @ (${cropLeft},${cropTop})\n`);

  for (const size of SIZES) {
    for (const ext of ['avif', 'webp', 'jpg']) {
      const out = join(OUTDIR, `portrait-${size}.${ext}`);
      const pipe = sharp(INPUT)
        .extract({ left: cropLeft, top: cropTop, width: squareSize, height: squareSize })
        .resize(size, size, { fit: 'cover', kernel: 'lanczos3' });

      if (ext === 'avif') await pipe.avif({ quality: 55, effort: 7 }).toFile(out);
      else if (ext === 'webp') await pipe.webp({ quality: 82, effort: 6 }).toFile(out);
      else if (ext === 'jpg') await pipe.jpeg({ quality: 85, mozjpeg: true }).toFile(out);

      const bytes = statSync(out).size;
      console.log(`  portrait-${size}.${ext.padEnd(4)} -> ${bytes.toString().padStart(6)} bytes`);
    }
  }
})().catch((err) => {
  console.error('failed:', err);
  process.exit(1);
});
