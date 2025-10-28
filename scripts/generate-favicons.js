const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function generateFavicons() {
  const logoPath = path.join(__dirname, '../public/logo.png');
  const publicDir = path.join(__dirname, '../public');

  try {
    // Load and get image info
    const image = sharp(logoPath);
    const metadata = await image.metadata();

    console.log(`📸 Processing logo (${metadata.width}x${metadata.height})`);

    // Extract the circular logo part (center crop)
    const size = Math.min(metadata.width, metadata.height);
    const cropSize = Math.floor(size * 0.6); // Crop to circle area
    const left = Math.floor((metadata.width - cropSize) / 2);
    const top = Math.floor((metadata.height - cropSize) / 2);

    const croppedImage = sharp(logoPath)
      .extract({ left, top, width: cropSize, height: cropSize });

    // Generate favicon.ico (32x32)
    await croppedImage
      .clone()
      .resize(32, 32)
      .toFile(path.join(publicDir, 'favicon.ico'));
    console.log('✓ Created favicon.ico (32x32)');

    // Generate apple-touch-icon.png (180x180)
    await croppedImage
      .clone()
      .resize(180, 180)
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));
    console.log('✓ Created apple-touch-icon.png (180x180)');

    // Generate icon-192.png for Android (192x192)
    await croppedImage
      .clone()
      .resize(192, 192)
      .toFile(path.join(publicDir, 'icon-192.png'));
    console.log('✓ Created icon-192.png (192x192)');

    // Generate icon-512.png for Android (512x512)
    await croppedImage
      .clone()
      .resize(512, 512)
      .toFile(path.join(publicDir, 'icon-512.png'));
    console.log('✓ Created icon-512.png (512x512)');

    console.log('\n✅ All favicon files generated successfully!');
  } catch (error) {
    console.error('❌ Error generating favicons:', error);
    process.exit(1);
  }
}

generateFavicons();
