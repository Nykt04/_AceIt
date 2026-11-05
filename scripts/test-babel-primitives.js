const babel = require('@babel/core');
const fs = require('fs');
const path = require('path');

const files = [
  path.join('src', 'components', 'brutal', 'BrutalCard.js'),
  path.join('src', 'components', 'brutal', 'BrutalButton.js'),
  path.join('src', 'components', 'brutal', 'BrutalSkeleton.js'),
  path.join('src', 'components', 'brutal', 'BrutalBadge.js'),
  path.join('src', 'components', 'brutal', 'BrutalInput.js'),
  path.join('src', 'components', 'Navbar.js'),
  path.join('src', 'components', 'Sidebar.js'),
  path.join('src', 'screens', 'HomeScreen.js'),
  path.join('src', 'screens', 'SetDetailScreen.js'),
  path.join('src', 'screens', 'StudyScreen.js'),
];

for (const file of files) {
  const code = fs.readFileSync(file, 'utf8');
  const result = babel.transformSync(code, {
    filename: file,
    configFile: path.resolve('./babel.config.js')
  });
  if (!result || !result.code) {
    throw new Error(`Failed to transform ${file}`);
  }
  console.log(`✓ ${file} passed babel compilation`);
}

console.log('All core screens & components passed Babel compilation successfully!');
