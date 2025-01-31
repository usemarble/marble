

import sharp from 'sharp';

export async function compressImage(file: File): Promise<File> {
  const buffer = await file.arrayBuffer();
  
  const compressedBuffer = await sharp(buffer)
    .webp({ quality: 80 })
    .resize(1920, undefined, {
      withoutEnlargement: true,
      fit: 'inside',
    })
    .toBuffer();

  return new File([compressedBuffer], file.name.replace(/\.[^/.]+$/, '.webp'), {
    type: 'image/webp',
  });
}
