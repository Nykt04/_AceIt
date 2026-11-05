const babel = require('@babel/core');
const fs = require('fs');
const path = require('path');

const files = [
  'BrutalCard.js',
  'BrutalButton.js',
  'BrutalSkeleton.js',
  'BrutalBadge.js',
  'BrutalInput.js',
  'index.js'
];

for (const file of files) {
  const filePath = path.join('src', 'components', 'brutal', file);
  const code = fs.readFileSync(filePath, 'utf8');
  const result = babel.transformSync(code, {
    filename: filePath,
    configFile: path.resolve('./babel.config.js')
  });
  if (!result || !result.code) {
    throw new Error(`Failed to transform ${file}`);
  }
  console.log(`✓ ${file} passed babel compilation`);
}

console.log('All brutal primitives passed Babel transformation successfully!');
