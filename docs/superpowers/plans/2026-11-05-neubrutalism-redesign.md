# AceIt Neubrutalism Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the AceIt study application UI into a strict Neubrutalism aesthetic (thick hard borders, stark unblurred offset drop shadows, editorial color palette, tactile physical press effects, and vector iconography) for the navigation shell and core study flow.

**Architecture:** Establish centralized Neubrutalist design tokens and a backward-compatible adapter in `ThemeContext.js` so unmigrated screens continue functioning smoothly without breaking. Build modular, reusable brutalist primitives (`BrutalCard`, `BrutalButton`, `BrutalSkeleton`, `BrutalBadge`, `BrutalInput`) and integrate them across `Navbar`, `Sidebar`, `HomeScreen`, `SetDetailScreen`, and `StudyScreen`.

**Tech Stack:** React 19, React Native 0.85, React Native Web 0.19, Expo SDK 56, `@expo/vector-icons`, Supabase JS.

**Spec:** [`docs/superpowers/specs/2026-11-05-neubrutalism-redesign-design.md`](file:///c:/College%20Days/2nd%20year%20college/2nd%20Sem/MAJOR%20COURSES/AppDev/study-buddy-app/docs/superpowers/specs/2026-11-05-neubrutalism-redesign-design.md)

## Global Constraints

- 3px–4px solid borders with 0px–4px corner radii.
- Stark unblurred offset shadows: `4px 4px 0 #000` (Light Mode) and `4px 4px 0 #FFF` (Dark Mode).
- Strictly zero emojis in UI chrome; vector icons only from `@expo/vector-icons`.
- Tactile press interaction: translate `(2px, 2px)` on press to meet offset shadows.
- Zero circular spinners: use structured geometric skeleton cards during loading.
- Must not break Supabase state, authentication flows, or React Navigation routes.

## Review Focus

1. **Light/Dark Toggle Contrast:** Ensure dark mode offset shadows and borders render crisp `#FFFFFF` against `#121212` without border clipping.
2. **Backward Compatibility:** Ensure existing unmigrated screens referencing legacy theme keys (`theme.secondary`, `theme.tertiary`, `theme.primaryAccent`) do not crash or display garish broken colors.
3. **Web Box-Shadow Rendering:** Verify that `react-native-web` correctly applies the unblurred `4px 4px 0px` box shadow without blur radius bleeding.
4. **Mobile Responsive Touch Targets:** Ensure buttons maintain a minimum 48x48px hit area and do not overflow small viewports.
5. **Flashcard Flip Geometry:** Verify that `StudyScreen` card flipping works cleanly with thick brutalist borders and doesn't clip on rotation.

---

### Task 1: Neubrutalist Tokens & ThemeContext Backward-Compatible Adapter

**Files:**
- Create: `src/theme/tokens.js`
- Modify: `src/context/ThemeContext.js`
- Test: `scripts/test-theme-tokens.js`

**Interfaces:**
- Produces: `BRUTAL_TOKENS` with `colors.light`, `colors.dark`, `borderWidth: 3`, `shadowOffset: 4`.
- Produces: `useTheme()` providing `{ theme, isDarkMode, toggleTheme, isLoading }` where `theme` includes both legacy aliases (`primaryAccent`, `secondary`, `tertiary`) and brutal tokens (`card`, `shadow`, `brandSecondary`, `accent`, `borderWidth`, `shadowOffset`).

- [ ] **Step 1: Write verification script for theme tokens and legacy aliases**

Create `scripts/test-theme-tokens.js` that imports tokens and theme definitions, verifying all required keys exist and match spec values:
```javascript
const assert = require('assert');
const { BRUTAL_TOKENS } = require('../src/theme/tokens');

assert.strictEqual(BRUTAL_TOKENS.borderWidth, 3);
assert.strictEqual(BRUTAL_TOKENS.shadowOffset, 4);
assert.strictEqual(BRUTAL_TOKENS.colors.light.background, '#FFFDF5');
assert.strictEqual(BRUTAL_TOKENS.colors.dark.shadow, '#FFFFFF');
console.log('Token check passed');
```

- [ ] **Step 2: Run verification script to confirm it fails**

Run: `node scripts/test-theme-tokens.js`  
Expected: FAIL (`Cannot find module '../src/theme/tokens'`)

- [ ] **Step 3: Implement `src/theme/tokens.js` and update `src/context/ThemeContext.js`**

Export `BRUTAL_TOKENS` in `tokens.js`. In `ThemeContext.js`, map `DARK_THEME` and `LIGHT_THEME` to use brutalist background/card/border/shadow/primary/secondary colors while aliasing legacy properties (`theme.secondary = theme.card`, `theme.primaryAccent = theme.primary`, `theme.tertiary = theme.muted`).

- [ ] **Step 4: Run verification script to confirm it passes**

Run: `node scripts/test-theme-tokens.js`  
Expected: PASS (`Token check passed`)

- [ ] **Step 5: Commit**

```bash
git add src/theme/tokens.js src/context/ThemeContext.js scripts/test-theme-tokens.js
git commit -m "feat(theme): add neubrutalist tokens and theme adapter"
```

---

### Task 2: Core Neubrutalist UI Primitives

**Files:**
- Create: `src/components/brutal/BrutalCard.js`
- Create: `src/components/brutal/BrutalButton.js`
- Create: `src/components/brutal/BrutalSkeleton.js`
- Create: `src/components/brutal/BrutalBadge.js`
- Create: `src/components/brutal/BrutalInput.js`
- Create: `src/components/brutal/index.js`
- Test: `scripts/test-brutal-primitives.js`

**Interfaces:**
- Produces:
  - `BrutalCard({ children, style, accentColor, headerTitle, shadowOffset })`
  - `BrutalButton({ title, onPress, variant, icon, disabled, style, textStyle })` (implements `(2px, 2px)` tactile down-and-right translate on press)
  - `BrutalSkeleton({ width, height, style })` (geometric block pulse with 3px border, no circular spinner)
  - `BrutalBadge({ label, color, textColor })`
  - `BrutalInput({ value, onChangeText, placeholder, style, ...props })`

- [ ] **Step 1: Write smoke test for brutal component exports**

Create `scripts/test-brutal-primitives.js`:
```javascript
const assert = require('assert');
const primitives = require('../src/components/brutal');
assert(primitives.BrutalCard, 'BrutalCard exported');
assert(primitives.BrutalButton, 'BrutalButton exported');
assert(primitives.BrutalSkeleton, 'BrutalSkeleton exported');
assert(primitives.BrutalBadge, 'BrutalBadge exported');
assert(primitives.BrutalInput, 'BrutalInput exported');
console.log('Primitives export check passed');
```

- [ ] **Step 2: Run verification script to confirm it fails**

Run: `node scripts/test-brutal-primitives.js`  
Expected: FAIL (`Cannot find module '../src/components/brutal'`)

- [ ] **Step 3: Implement components in `src/components/brutal/`**

Build:
- `BrutalCard.js`: Hard 3px border (`theme.border`), unblurred offset shadow (`boxShadow: '4px 4px 0px ' + theme.shadow`), flat card background.
- `BrutalButton.js`: Tactile press animation using React Native `Animated` or `Pressable` style callback (`transform: [{ translateX: pressed ? 2 : 0 }, { translateY: pressed ? 2 : 0 }]`), minHeight 48px, bold uppercase text.
- `BrutalSkeleton.js`: Geometric view with 3px border, looping opacity interpolation between 0.4 and 0.9.
- `BrutalBadge.js`: High-saturation pill/tag with black border and bold font.
- `BrutalInput.js`: High-contrast input with 3px border and 2px offset shadow on focus.
- `index.js`: Re-export all primitives.

- [ ] **Step 4: Run verification script to confirm it passes**

Run: `node scripts/test-brutal-primitives.js`  
Expected: PASS (`Primitives export check passed`)

- [ ] **Step 5: Commit**

```bash
git add src/components/brutal/ scripts/test-brutal-primitives.js
git commit -m "feat(ui): implement neubrutalist core primitives"
```

---

### Task 3: Redesign Navigation Shell (`Navbar.js` & `Sidebar.js`)

**Files:**
- Modify: `src/components/Navbar.js`
- Modify: `src/components/Sidebar.js`
- Test: Manual visual check on web + component import test `scripts/test-shell.js`

**Interfaces:**
- Consumes: `BrutalButton` from `src/components/brutal`, `@expo/vector-icons`, `useTheme()`.
- Produces: Redesigned `Navbar` and `Sidebar` with 3px solid black/white borders, crisp vector icons (Feather/Ionicons), and tactile theme toggle button.

- [ ] **Step 1: Write import/integrity test for shell components**

Create `scripts/test-shell.js`:
```javascript
const assert = require('assert');
const Navbar = require('../src/components/Navbar').default;
const Sidebar = require('../src/components/Sidebar').default;
assert(Navbar, 'Navbar loads');
assert(Sidebar, 'Sidebar loads');
console.log('Shell components load successfully');
```

- [ ] **Step 2: Run verification test**

Run: `node scripts/test-shell.js`  
Expected: PASS

- [ ] **Step 3: Overhaul `Navbar.js` and `Sidebar.js`**

- In `Navbar.js`:
  - Replace ASCII `≣` with vector icon `<Feather name="menu" size={24} color={theme.text} />`.
  - Add 3px solid borderBottom with `theme.border`.
  - Replace settings text with tactile `BrutalButton` or styled brutal icon button.
  - Add quick theme toggle button with Feather `sun`/`moon` icon.
- In `Sidebar.js`:
  - Replace soft drawer styles with 3px solid right border, hard offset shadow, and brutal navigation item tiles with vector icons (`Feather` home, book, settings, log-out).
  - Ensure zero emojis in all link labels.

- [ ] **Step 4: Verify shell component syntax and build integrity**

Run: `node scripts/test-shell.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/Navbar.js src/components/Sidebar.js scripts/test-shell.js
git commit -m "feat(navigation): overhaul navbar and sidebar with neubrutalist styling"
```

---

### Task 4: Redesign Core Study Screens (`HomeScreen`, `SetDetailScreen`, `StudyScreen`)

**Files:**
- Modify: `src/screens/HomeScreen.js`
- Modify: `src/screens/SetDetailScreen.js`
- Modify: `src/screens/StudyScreen.js`
- Test: `scripts/test-screens-import.js`

**Interfaces:**
- Consumes: `BrutalCard`, `BrutalButton`, `BrutalSkeleton`, `BrutalBadge` from `src/components/brutal`.
- Modifies:
  - `HomeScreen`: Hero section with bold brutal typography (`Safety Orange` / `Electric Cobalt` accents), study set cards as brutal blocks with offset shadows, and `BrutalSkeleton` cards during data fetch.
  - `SetDetailScreen`: Action bar with brutal tactile buttons, flashcard preview deck with thick geometric borders.
  - `StudyScreen`: Physical index card style flashcard with 3px border, unblurred shadow, snappy flip physics, and high-contrast rating buttons.

- [ ] **Step 1: Write screens import check script**

Create `scripts/test-screens-import.js`:
```javascript
const assert = require('assert');
assert(require('../src/screens/HomeScreen').default);
assert(require('../src/screens/SetDetailScreen').default);
assert(require('../src/screens/StudyScreen').default);
console.log('Core screens load successfully');
```

- [ ] **Step 2: Run verification test**

Run: `node scripts/test-screens-import.js`  
Expected: PASS

- [ ] **Step 3: Overhaul `HomeScreen.js`**

- Replace soft cards and spinners with `BrutalCard` and `BrutalSkeleton`.
- Add brutalist hero banner with punchy accents.
- Replace any emoji icons with `@expo/vector-icons` (e.g. Feather `folder`, `plus`, `clock`).
- Implement spring entry stagger on card load.

- [ ] **Step 4: Overhaul `SetDetailScreen.js` and `StudyScreen.js`**

- In `SetDetailScreen.js`: Replace action buttons with `BrutalButton`, study cards with `BrutalCard`, and badge counters with `BrutalBadge`.
- In `StudyScreen.js`: Transform the study card into an unblurred physical card with 3px border and 4px offset shadow. Format score & progress indicators into high-contrast brutalist meters.

- [ ] **Step 5: Run screen import verification**

Run: `node scripts/test-screens-import.js`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/screens/HomeScreen.js src/screens/SetDetailScreen.js src/screens/StudyScreen.js scripts/test-screens-import.js
git commit -m "feat(screens): apply neubrutalism design to HomeScreen, SetDetailScreen, and StudyScreen"
```

---

### Task 5: End-to-End Build Verification & Impeccable Detector

**Files:**
- Modify: Any style touch-ups needed from build output
- Run: `npm run build` (`npx expo export --platform web`)
- Run: Impeccable detector command

- [ ] **Step 1: Execute web build check**

Run: `npm run build`  
Expected: Successful web bundle export into `dist/` with zero bundle syntax or import errors.

- [ ] **Step 2: Run Impeccable design detector**

Run: `& "C:\Users\Gian Karlo\.gemini\config\skills\impeccable\scripts\impeccable.cmd" detect --json src/theme/tokens.js src/components/brutal/BrutalCard.js src/screens/HomeScreen.js`  
Expected: Verified check output confirming design compliance.

- [ ] **Step 3: Clean up temporary test scripts**

Remove `scripts/test-theme-tokens.js`, `scripts/test-brutal-primitives.js`, `scripts/test-shell.js`, `scripts/test-screens-import.js` (or move them to standard tests).

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "chore: complete phase 1 neubrutalism redesign and verification"
```
