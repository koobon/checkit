// 아이콘 생성 스크립트
// 512x512 PNG 아이콘을 준비한 후 이 스크립트를 실행하세요

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  const inputPath = './icon-512.png'; // 원본 512x512 아이콘 경로
  const outputDir = './public/icons';

  // 디렉토리 생성
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 각 크기별 아이콘 생성
  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
    
    await sharp(inputPath)
      .resize(size, size)
      .toFile(outputPath);
    
    console.log(`Created ${outputPath}`);
  }

  // Favicon 생성
  await sharp(inputPath)
    .resize(32, 32)
    .toFile('./public/favicon.ico');
  
  console.log('All icons generated successfully!');
}

// 사용법:
// 1. npm install sharp --save-dev
// 2. 512x512 PNG 아이콘을 icon-512.png로 저장
// 3. node generate-icons.js 실행

generateIcons().catch(console.error);