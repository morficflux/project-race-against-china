// Fake "kid's marker drawing of a car on white paper" for pipeline testing.
import sharp from 'sharp';

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900">
  <rect width="1200" height="900" fill="#fdfcf8"/>
  <!-- wobbly car body, thick marker outline -->
  <path d="M 250 560 Q 240 480 320 470 L 420 460 Q 460 380 560 375 L 720 370
           Q 800 375 830 460 L 920 470 Q 990 480 980 560 Q 970 600 900 600
           L 330 605 Q 255 605 250 560 Z"
        fill="#e84a3f" stroke="#222" stroke-width="14"/>
  <!-- windows -->
  <path d="M 480 460 Q 505 400 570 395 L 640 392 L 645 455 Z" fill="#bfe6f5" stroke="#222" stroke-width="10"/>
  <path d="M 675 392 L 740 390 Q 790 395 810 455 L 678 458 Z" fill="#bfe6f5" stroke="#222" stroke-width="10"/>
  <!-- a proud driver squiggle -->
  <circle cx="600" cy="430" r="18" fill="#f5c06d" stroke="#222" stroke-width="8"/>
</svg>`;

await sharp(Buffer.from(svg)).jpeg({ quality: 88 }).toFile(process.argv[2]);
console.log('wrote', process.argv[2]);
