// Generates favicon + OG assets. Run after the portrait or branding changes:
//   node make-icons.js
//
// Outputs in public/:
//   favicon.svg          (canonical, served to modern browsers)
//   favicon.ico          (legacy fallback, PNG-in-ICO 32x32)
//   apple-touch-icon.png (180x180, iOS home screen)
//   og-image.png         (1200x630, social share preview)

const sharp = require('sharp');
const fs = require('node:fs');
const path = require('node:path');

const PUBLIC = path.join(__dirname, 'public');

const ACCENT = '#c2410c';
const BG_DARK = '#0a0a0b';
const FG_LIGHT = '#fafafa';
const MUTED = '#a1a1aa';
const ACCENT_DARK = '#fb923c';

const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="8" fill="${ACCENT}"/>
  <text x="16" y="23" text-anchor="middle" font-family="Segoe UI, system-ui, -apple-system, sans-serif" font-size="22" font-weight="700" fill="#ffffff">a</text>
</svg>
`;

async function writeFavicon() {
  fs.writeFileSync(path.join(PUBLIC, 'favicon.svg'), FAVICON_SVG);
  console.log('wrote favicon.svg');
}

async function writeFaviconIco() {
  const png = await sharp(Buffer.from(FAVICON_SVG)).resize(32, 32).png().toBuffer();
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  header.writeUInt8(32, 6);
  header.writeUInt8(32, 7);
  header.writeUInt8(0, 8);
  header.writeUInt8(0, 9);
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(22, 18);
  fs.writeFileSync(path.join(PUBLIC, 'favicon.ico'), Buffer.concat([header, png]));
  console.log(`wrote favicon.ico (${22 + png.length} bytes)`);
}

async function writeAppleTouchIcon() {
  await sharp(Buffer.from(FAVICON_SVG))
    .resize(180, 180)
    .png({ compressionLevel: 9 })
    .toFile(path.join(PUBLIC, 'apple-touch-icon.png'));
  console.log('wrote apple-touch-icon.png');
}

async function writeOgImage() {
  const portraitPath = path.join(PUBLIC, 'portrait-336.jpg');
  const portraitSize = 360;
  const radius = 14;

  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${portraitSize}" height="${portraitSize}">
       <rect x="0" y="0" width="${portraitSize}" height="${portraitSize}" rx="${radius}" ry="${radius}" fill="#fff"/>
     </svg>`
  );

  const portrait = await sharp(portraitPath)
    .resize(portraitSize, portraitSize)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <rect width="1200" height="630" fill="${BG_DARK}"/>
    <text x="540" y="295" font-family="Segoe UI, system-ui, -apple-system, sans-serif" font-size="78" font-weight="600" fill="${FG_LIGHT}" letter-spacing="-2">Alexander Brittain</text>
    <text x="540" y="355" font-family="Segoe UI, system-ui, -apple-system, sans-serif" font-size="30" font-weight="400" fill="${MUTED}">Software Engineer</text>
    <text x="540" y="400" font-family="Segoe UI, system-ui, -apple-system, sans-serif" font-size="30" font-weight="400" fill="${MUTED}">U.S. Department of the Treasury</text>
    <text x="540" y="495" font-family="Consolas, ui-monospace, monospace" font-size="22" font-weight="500" fill="${ACCENT_DARK}">alexanderbrittain.com</text>
  </svg>`;

  await sharp(Buffer.from(ogSvg))
    .composite([{ input: portrait, left: 110, top: 135 }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(PUBLIC, 'og-image.png'));
  console.log('wrote og-image.png');
}

(async () => {
  await writeFavicon();
  await writeFaviconIco();
  await writeAppleTouchIcon();
  await writeOgImage();
})().catch((err) => {
  console.error('failed:', err);
  process.exit(1);
});
