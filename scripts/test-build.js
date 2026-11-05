const assert = require('assert');
const babel = require('@babel/core');
const fs = require('fs');
const path = require('path');

// 1. Verify Tokens
const tokensContent = fs.readFileSync('src/theme/tokens.js', 'utf8');
assert(tokensContent.includes("borderWidth: 3"), 'borderWidth 3');
assert(tokensContent.includes("shadowOffset: 4"), 'shadowOffset 4');
assert(tokensContent.includes("#FFFDF5"), 'Warm cream present');
assert(tokensContent.includes("#2563EB"), 'Electric cobalt present');

// 2. Verify Babel AST compilation for all touched files
const files = [
  path.join('src', 'theme', 'tokens.js'),
  path.join('src', 'components', 'brutal', 'BrutalCard.js'),
  path.join('src', 'components', 'brutal', 'BrutalButton.js'),
  path.join('src', 'components', 'brutal', 'BrutalSkeleton.js'),
  path.join('src', 'components', 'brutal', 'BrutalBadge.js'),
  path.join('src', 'components', 'brutal', 'BrutalInput.js'),
  path.join('src', 'components', 'brutal', 'index.js'),
  path.join('src', 'components', 'Navbar.js'),
  path.join('src', 'components', 'Sidebar.js'),
  path.join('src', 'screens', 'HomeScreen.js'),
  path.join('src', 'screens', 'SetDetailScreen.js'),
  path.join('src', 'screens', 'StudyScreen.js'),
  path.join('src', 'screens', 'TermsAndConditionsScreen.js'),
  path.join('src', 'screens', 'PrivacyPolicyScreen.js'),
  path.join('src', 'screens', 'AboutScreen.js'),
  path.join('src', 'screens', 'LoginSignupScreen.js'),
];

for (const file of files) {
  const code = fs.readFileSync(file, 'utf8');
  const result = babel.transformSync(code, {
    filename: file,
    configFile: path.resolve('./babel.config.js')
  });
  if (!result || !result.code) {
    throw new Error(`Failed to compile ${file}`);
  }
}

console.log('✓ All Neubrutalism screens and components verified successfully!');
