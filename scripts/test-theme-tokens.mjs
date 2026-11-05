import assert from 'assert';
import { BRUTAL_TOKENS, DARK_THEME, LIGHT_THEME } from '../src/theme/tokens.js';

// Check brutal tokens
assert.strictEqual(BRUTAL_TOKENS.borderWidth, 3, 'borderWidth should be 3');
assert.strictEqual(BRUTAL_TOKENS.shadowOffset, 4, 'shadowOffset should be 4');
assert.strictEqual(BRUTAL_TOKENS.colors.light.background, '#FFFDF5', 'Light background should be #FFFDF5');
assert.strictEqual(BRUTAL_TOKENS.colors.dark.shadow, '#FFFFFF', 'Dark shadow should be #FFFFFF');
assert.strictEqual(BRUTAL_TOKENS.colors.light.shadow, '#121212', 'Light shadow should be #121212');

// Check brutal extensions on themes
assert(LIGHT_THEME.card, 'Light theme must have card');
assert(DARK_THEME.card, 'Dark theme must have card');
assert.strictEqual(LIGHT_THEME.borderWidth, 3, 'Light theme borderWidth');
assert.strictEqual(DARK_THEME.borderWidth, 3, 'Dark theme borderWidth');
assert.strictEqual(LIGHT_THEME.shadowOffset, 4, 'Light theme shadowOffset');
assert.strictEqual(DARK_THEME.shadowOffset, 4, 'Dark theme shadowOffset');

// Legacy aliases must remain intact
assert(LIGHT_THEME.primaryAccent, 'Legacy primaryAccent missing in light theme');
assert(DARK_THEME.primaryAccent, 'Legacy primaryAccent missing in dark theme');
assert(LIGHT_THEME.secondary, 'Legacy secondary missing in light theme');
assert(DARK_THEME.secondary, 'Legacy secondary missing in dark theme');
assert(LIGHT_THEME.tertiary, 'Legacy tertiary missing in light theme');
assert(DARK_THEME.tertiary, 'Legacy tertiary missing in dark theme');

console.log('Token check passed successfully!');
