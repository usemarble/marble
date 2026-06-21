// biome-ignore-all lint/suspicious/noBitwiseOperators: ZIP headers and CRC32 require byte-level bitwise arithmetic.
/**
 * File archive helpers for Workers-compatible background jobs.
 *
 * The ZIP writer intentionally stores files without compression. That keeps it
 * dependency-free, deterministic, and compatible with Cloudflare Workers while
 * still producing a standard ZIP archive for small JSON export bundles.
 */

type ZipFileMap = Record<string, string>;

const ZIP_UINT16_MAX = 0xff_ff;
const ZIP_UINT32_MAX = 0xff_ff_ff_ff;

function writeUint16(buffer: Uint8Array, offset: number, value: number) {
  buffer[offset] = value & 0xff;
  buffer[offset + 1] = (value >>> 8) & 0xff;
}

function writeUint32(buffer: Uint8Array, offset: number, value: number) {
  buffer[offset] = value & 0xff;
  buffer[offset + 1] = (value >>> 8) & 0xff;
  buffer[offset + 2] = (value >>> 16) & 0xff;
  buffer[offset + 3] = (value >>> 24) & 0xff;
}

const CRC_TABLE = new Uint32Array(256).map((_, index) => {
  let crc = index;
  for (let bit = 0; bit < 8; bit++) {
    crc = crc & 1 ? 0xed_b8_83_20 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});

function crc32(data: Uint8Array) {
  let crc = 0xff_ff_ff_ff;
  for (const byte of data) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xff_ff_ff_ff) >>> 0;
}

/**
 * Serializes a value as stable, pretty-printed JSON with a trailing newline.
 */
export function stringifyJsonFile(value: unknown) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

/**
 * Builds a standards-compliant ZIP archive from UTF-8 text files.
 *
 * Files are stored without compression, which keeps the implementation small and
 * avoids Node-only archive packages in the Workers runtime.
 */
export function buildZipArchive(files: ZipFileMap) {
  const encoder = new TextEncoder();
  const entries = Object.entries(files).map(([name, content]) => ({
    nameBytes: encoder.encode(name),
    data: encoder.encode(content),
  }));

  if (entries.length > ZIP_UINT16_MAX) {
    throw new Error("ZIP archive contains too many files");
  }

  let localSize = 0;
  let centralSize = 0;
  for (const entry of entries) {
    if (entry.nameBytes.length > ZIP_UINT16_MAX) {
      throw new Error("ZIP file name is too long");
    }

    if (entry.data.length > ZIP_UINT32_MAX) {
      throw new Error("ZIP file is too large");
    }

    localSize += 30 + entry.nameBytes.length + entry.data.length;
    centralSize += 46 + entry.nameBytes.length;
  }

  if (
    localSize > ZIP_UINT32_MAX ||
    centralSize > ZIP_UINT32_MAX ||
    localSize + centralSize + 22 > ZIP_UINT32_MAX
  ) {
    throw new Error("ZIP archive is too large");
  }

  const archive = new Uint8Array(localSize + centralSize + 22);
  const centralRecords: Array<{
    entry: (typeof entries)[number];
    crc: number;
    localOffset: number;
  }> = [];

  let offset = 0;
  for (const entry of entries) {
    const localOffset = offset;
    const checksum = crc32(entry.data);

    writeUint32(archive, offset, 0x04_03_4b_50);
    writeUint16(archive, offset + 4, 20);
    writeUint16(archive, offset + 6, 0);
    writeUint16(archive, offset + 8, 0);
    writeUint16(archive, offset + 10, 0);
    writeUint16(archive, offset + 12, 0);
    writeUint32(archive, offset + 14, checksum);
    writeUint32(archive, offset + 18, entry.data.length);
    writeUint32(archive, offset + 22, entry.data.length);
    writeUint16(archive, offset + 26, entry.nameBytes.length);
    writeUint16(archive, offset + 28, 0);
    offset += 30;

    archive.set(entry.nameBytes, offset);
    offset += entry.nameBytes.length;
    archive.set(entry.data, offset);
    offset += entry.data.length;

    centralRecords.push({ entry, crc: checksum, localOffset });
  }

  const centralOffset = offset;
  for (const record of centralRecords) {
    const { entry } = record;
    writeUint32(archive, offset, 0x02_01_4b_50);
    writeUint16(archive, offset + 4, 20);
    writeUint16(archive, offset + 6, 20);
    writeUint16(archive, offset + 8, 0);
    writeUint16(archive, offset + 10, 0);
    writeUint16(archive, offset + 12, 0);
    writeUint16(archive, offset + 14, 0);
    writeUint32(archive, offset + 16, record.crc);
    writeUint32(archive, offset + 20, entry.data.length);
    writeUint32(archive, offset + 24, entry.data.length);
    writeUint16(archive, offset + 28, entry.nameBytes.length);
    writeUint16(archive, offset + 30, 0);
    writeUint16(archive, offset + 32, 0);
    writeUint16(archive, offset + 34, 0);
    writeUint16(archive, offset + 36, 0);
    writeUint32(archive, offset + 38, 0);
    writeUint32(archive, offset + 42, record.localOffset);
    offset += 46;

    archive.set(entry.nameBytes, offset);
    offset += entry.nameBytes.length;
  }

  writeUint32(archive, offset, 0x06_05_4b_50);
  writeUint16(archive, offset + 4, 0);
  writeUint16(archive, offset + 6, 0);
  writeUint16(archive, offset + 8, entries.length);
  writeUint16(archive, offset + 10, entries.length);
  writeUint32(archive, offset + 12, centralSize);
  writeUint32(archive, offset + 16, centralOffset);
  writeUint16(archive, offset + 20, 0);

  return archive;
}
