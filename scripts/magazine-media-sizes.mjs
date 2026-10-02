// Liest die Bildmaße aller Magazin-Medien aus den Dateien in public/ und schreibt data/magazine-media-sizes.json
// ({ "<Attachment-ID>": { width, height } }). Der WordPress-kompatible REST-Endpunkt (lib/wp-rest-compat.ts)
// liefert sie als media_details. Neu erzeugen, wenn sich Medien im Katalog ändern:
//   node scripts/magazine-media-sizes.mjs
import { readFileSync, writeFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const catalog = JSON.parse(readFileSync(new URL("data/magazine.json", root), "utf8"));

function size(buffer) {
  // PNG
  if (buffer.toString("latin1", 1, 4) === "PNG") return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  // GIF
  if (buffer.toString("latin1", 0, 3) === "GIF") return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
  // WebP
  if (buffer.toString("latin1", 0, 4) === "RIFF" && buffer.toString("latin1", 8, 12) === "WEBP") {
    const kind = buffer.toString("latin1", 12, 16);
    if (kind === "VP8X") return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
    if (kind === "VP8 ") return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
    if (kind === "VP8L") {
      const bits = buffer.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
  }
  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) { offset += 1; continue; }
      const marker = buffer[offset + 1];
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
      }
      offset += 2 + buffer.readUInt16BE(offset + 2);
    }
  }
  return null;
}

const sizes = {};
for (const asset of catalog.assets) {
  if (!asset.mimeType.startsWith("image/")) continue;
  try {
    const found = size(readFileSync(new URL(`public${asset.localPath}`, root)));
    if (found && found.width > 0 && found.height > 0) sizes[asset.id] = found;
    else console.warn(`Keine Maße: ${asset.localPath}`);
  } catch (error) {
    console.warn(`Nicht lesbar: ${asset.localPath} (${error.message})`);
  }
}
writeFileSync(new URL("data/magazine-media-sizes.json", root), `${JSON.stringify(sizes, null, 1)}\n`);
console.log(`${Object.keys(sizes).length} Bildmaße geschrieben.`);
