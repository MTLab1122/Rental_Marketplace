import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const publicDir = path.resolve('apps/web/public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Create SVG Favicon
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect width="64" height="64" rx="12" fill="#059669"/>
  <path d="M18 46V18h14c7 0 12 4 12 10s-5 10-12 10H26v8h-8zm8-16h6c3.3 0 6-1.8 6-5s-2.7-5-6-5h-6v10z" fill="#ffffff"/>
</svg>`;
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg, 'utf8');

// 2. Generate PNG helper using raw deflate
function createPng(width, height, r, g, b) {
  const bytesPerPixel = 3;
  const scanlineLength = width * bytesPerPixel + 1; // 1 byte for filter type 0
  const rawData = Buffer.alloc(height * scanlineLength);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * bytesPerPixel;
      // Border or accent header line (Emerald line at the top)
      if (y < 8 || y > height - 8 || x < 8 || x > width - 8) {
        rawData[pixelOffset] = 5;     // Emerald R
        rawData[pixelOffset + 1] = 150;// Emerald G
        rawData[pixelOffset + 2] = 105;// Emerald B
      } else {
        rawData[pixelOffset] = r;
        rawData[pixelOffset + 1] = g;
        rawData[pixelOffset + 2] = b;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type (RGB)
  ihdr[10] = 0; // compression method
  ihdr[11] = 0; // filter method
  ihdr[12] = 0; // interlace method

  function makeChunk(type, data) {
    const typeBuf = Buffer.from(type, 'ascii');
    const length = data.length;
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(length, 0);

    const crcBuf = Buffer.alloc(4);
    const crc = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crc >>> 0, 0);

    return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
  }

  // Basic CRC32 table
  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      let byte = buf[i];
      for (let j = 0; j < 8; j++) {
        const bit = (crc ^ byte) & 1;
        crc = (crc >>> 1) ^ (bit ? 0xedb88320 : 0);
        byte = byte >>> 1;
      }
    }
    return crc ^ 0xffffffff;
  }

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate 1200x630 PNG with Navy (#0f172a = 15, 23, 42) background
const ogPng = createPng(1200, 630, 15, 23, 42);
fs.writeFileSync(path.join(publicDir, 'og-image.png'), ogPng);

// Generate 180x180 Apple Touch Icon with Emerald (#059669 = 5, 150, 105)
const appleTouch = createPng(180, 180, 5, 150, 105);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouch);

// Minimal valid baseline JPEG for og-image.jpg (1200x630)
function createBaselineJpeg(width, height) {
  // Quantization table
  const qTable = Buffer.alloc(64, 16);
  // DHT tables
  const dhtLumDc = Buffer.from([
    0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b
  ]);
  const dhtLumAc = Buffer.from([
    0x10, 0x00, 0x02, 0x01, 0x03, 0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01,
    0x7d, 0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06, 0x13, 0x51, 0x61,
    0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xa1, 0x08, 0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1,
    0xf0, 0x24, 0x33, 0x62, 0x72, 0x82, 0x09, 0x0a, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27,
    0x28, 0x29, 0x2a, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48,
    0x49, 0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68,
    0x69, 0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7a, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88,
    0x89, 0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6,
    0xa7, 0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4,
    0xc5, 0xc6, 0xc7, 0xc8, 0xc9, 0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1,
    0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7,
    0xf8, 0xf9, 0xfa
  ]);

  const chunks = [];
  // SOI
  chunks.push(Buffer.from([0xff, 0xd8]));
  // APP0 (JFIF)
  chunks.push(Buffer.from([
    0xff, 0xe0, 0x00, 0x10,
    0x4a, 0x46, 0x49, 0x46, 0x00, // JFIF\0
    0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00
  ]));
  // DQT
  chunks.push(Buffer.from([0xff, 0xdb, 0x00, 0x43, 0x00]), qTable);
  // SOF0 (Baseline, 1 component grayscale or YCbCr)
  // Length: 8 + 3*1 = 11 (0x0B)
  const sof0 = Buffer.alloc(11);
  sof0[0] = 8; // precision 8-bit
  sof0.writeUInt16BE(height, 1);
  sof0.writeUInt16BE(width, 3);
  sof0[5] = 1; // 1 component (Grayscale/Luma)
  sof0[6] = 1; // ID 1
  sof0[7] = 0x11; // 1x1 subsampling
  sof0[8] = 0; // Quant table 0
  chunks.push(Buffer.from([0xff, 0xc0, 0x00, 0x0b]), sof0);
  // DHT
  chunks.push(Buffer.from([0xff, 0xc4, 0x00, 0x1f]), dhtLumDc);
  chunks.push(Buffer.from([0xff, 0xc4, 0x00, 0xb5]), dhtLumAc);
  // SOS
  const sos = Buffer.from([
    0xff, 0xda, 0x00, 0x08,
    0x01, // 1 component
    0x01, 0x00, // comp 1 uses DC table 0, AC table 0
    0x00, 0x3f, 0x00 // spectral selection 0..63, approx 0
  ]);
  chunks.push(sos);

  // Compressed entropy data: block of zeroes (DC diff 0, EOB)
  // Number of 8x8 MCUs = ceil(width/8) * ceil(height/8) = 150 * 79 = 11850
  // Each MCU has DC diff = 0 (code 00) and EOB (code 1010 = 0x0A)
  // Let's create an 11850-block bit stream
  const mcuCount = Math.ceil(width / 8) * Math.ceil(height / 8);
  // DC=0 is code '00' (2 bits). EOB is code '1010' (4 bits).
  // Total 6 bits per MCU: 001010 (binary) = 0x0A
  const totalBits = mcuCount * 6;
  const totalBytes = Math.ceil(totalBits / 8) + 16;
  const bitBuf = Buffer.alloc(totalBytes, 0);
  let bitPos = 0;

  for (let m = 0; m < mcuCount; m++) {
    // Write 6 bits: 001010
    const code = 0x0a;
    for (let b = 5; b >= 0; b--) {
      const bit = (code >> b) & 1;
      const byteIdx = Math.floor(bitPos / 8);
      const bitInByte = 7 - (bitPos % 8);
      if (bit) {
        bitBuf[byteIdx] |= (1 << bitInByte);
      }
      bitPos++;
    }
  }

  // Byte stuffing for 0xFF
  const scanData = [];
  const validBytes = Math.ceil(bitPos / 8);
  for (let i = 0; i < validBytes; i++) {
    const val = bitBuf[i];
    scanData.push(val);
    if (val === 0xff) {
      scanData.push(0x00);
    }
  }

  chunks.push(Buffer.from(scanData));
  // EOI
  chunks.push(Buffer.from([0xff, 0xd9]));

  return Buffer.concat(chunks);
}

const ogJpeg = createBaselineJpeg(1200, 630);
fs.writeFileSync(path.join(publicDir, 'og-image.jpg'), ogJpeg);

// 3. Create Favicon.ico
// Minimal ICO header + PNG image
const icoHeader = Buffer.alloc(6);
icoHeader.writeUInt16LE(0, 0); // Reserved
icoHeader.writeUInt16LE(1, 2); // Type 1 = ICO
icoHeader.writeUInt16LE(1, 4); // 1 Image

const icoEntry = Buffer.alloc(16);
icoEntry[0] = 64; // width
icoEntry[1] = 64; // height
icoEntry[2] = 0;  // palette colors
icoEntry[3] = 0;  // reserved
icoEntry.writeUInt16LE(1, 4);  // color planes
icoEntry.writeUInt16LE(32, 6); // bpp
icoEntry.writeUInt32LE(appleTouch.length, 8); // size
icoEntry.writeUInt32LE(22, 12); // offset (6 + 16 = 22)

const faviconIco = Buffer.concat([icoHeader, icoEntry, appleTouch]);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), faviconIco);

console.log('Public assets generated successfully in', publicDir);
